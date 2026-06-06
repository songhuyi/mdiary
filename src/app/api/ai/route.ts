import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const AI_API_KEY = process.env.AI_API_KEY;
const AI_BASE_URL = process.env.AI_BASE_URL;
const AI_MODEL = process.env.AI_MODEL;

async function callAI(systemPrompt: string, userPrompt: string, maxTokens = 1000, model?: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  const selectedModel = model || AI_MODEL;

  try {
    console.log(`[AI] Calling model: ${selectedModel}, maxTokens: ${maxTokens}`);
    console.log(`[AI] User prompt preview: ${userPrompt.substring(0, 100)}...`);

    const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const rawText = await res.text();
    console.log(`[AI] Response status: ${res.status}`);
    console.log(`[AI] Response body (first 500 chars): ${rawText.substring(0, 500)}`);

    if (!res.ok) {
      throw new Error(`AI API error: ${res.status} ${rawText.substring(0, 300)}`);
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(`AI 返回了无效的 JSON 响应`);
    }

    const choices = data.choices as Array<{ message?: { content?: string; reasoning_content?: string } }> | undefined;
    if (!choices || choices.length === 0) {
      throw new Error(`AI 未返回 choices，原始响应: ${rawText.substring(0, 200)}`);
    }

    const message = choices[0]?.message;
    let content = message?.content?.trim() || "";

    // 推理模型可能把内容放在 reasoning_content
    if (!content && message?.reasoning_content) {
      const reasoning = message.reasoning_content.trim();
      // 从推理内容中提取标题：找最后一行非空文本作为答案
      const lines = reasoning.split("\n").filter((l: string) => l.trim() && !l.startsWith("<") && !l.startsWith("["));
      content = lines[lines.length - 1]?.trim() || "";
      // 清理可能的引号
      content = content.replace(/^[""「」]+|[""「」]+$/g, "").trim();
    }

    if (!content) {
      throw new Error(`AI 返回了空内容，原始响应: ${rawText.substring(0, 200)}`);
    }

    return content;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("AI 请求超时（60秒），请重试");
    }
    throw error;
  }
}

export async function POST(req: Request) {
  if (!AI_API_KEY || !AI_BASE_URL || !AI_MODEL) {
    return NextResponse.json({ error: "AI 未配置，请在 .env 中设置 AI_API_KEY 等变量" }, { status: 500 });
  }

  try {
    const { action, content, title, entryId, projectId, model: requestModel } = await req.json();
    const selectedModel = requestModel || AI_MODEL;

    if (action === "title") {
      const systemPrompt = "你是一个擅长取标题的助手。每次请求都是全新的，没有任何历史对话。你只根据当前用户提供的内容来生成标题。只输出标题本身，不要输出任何思考过程、解释或引号。";
      const userPrompt = `请根据以下文字内容，取一个简洁而有韵味的中文标题（不超过20个字）。只输出标题本身，不要加引号或任何解释。

内容：
${(content || "").substring(0, 3000)}`;

      let result = "";
      for (let i = 0; i < 2; i++) {
        try {
          result = await callAI(systemPrompt, userPrompt, 500, selectedModel);
          if (result) break;
        } catch (e) {
          if (i === 1) throw e;
        }
      }

      const cleanTitle = result.replace(/[""「」]/g, "").trim();
      if (!cleanTitle) {
        return NextResponse.json({ error: "AI 未返回标题，请重试" }, { status: 500 });
      }
      return NextResponse.json({ title: cleanTitle });
    }

    if (action === "polish") {
      let customRule = "";
      if (projectId) {
        const rule = await prisma.rule.findFirst({
          where: { projectId },
        });
        if (rule) customRule = rule.prompt;
      }
      if (!customRule) {
        const defaultRule = await prisma.rule.findFirst({
          where: { isDefault: true, projectId: null },
        });
        if (defaultRule) customRule = defaultRule.prompt;
      }

      const systemPrompt = "你是一个专业的文字整理助手。每次请求都是全新的独立任务，没有任何历史对话或上下文。你只根据当前用户粘贴的文字进行整理。你必须输出完整的整理结果，不能回复说没有看到内容。";
      const userPrompt = `请将以下文字进行深度整理，输出一篇完整的文章。

${customRule ? `整理规则：\n${customRule}\n` : ""}
输出格式（严格遵守）：
标题：你取的标题

正文：
整理后的完整文章内容

--- 以下是用户需要整理的文字 ---

${(content || "").substring(0, 8000)}`;

      const result = await callAI(systemPrompt, userPrompt, 4000, selectedModel);
      let aiTitle = "";
      let aiContent = result;

      const titleMatch = result.match(/标题[：:]\s*(.+)/);
      if (titleMatch) {
        aiTitle = titleMatch[1].trim();
        aiContent = result.replace(/标题[：:]\s*.+\n*/, "").replace(/^正文[：:]\s*\n?/, "").trim();
      }

      return NextResponse.json({ title: aiTitle, content: aiContent });
    }

    if (action === "tags") {
      const systemPrompt = "你是一个标签生成助手。每次请求都是全新的，没有任何历史对话。你只根据当前提供的标题和内容生成标签。只输出标签本身，不要输出任何思考过程或解释。";
      const userPrompt = `请根据以下文章的标题和内容，生成 3-5 个简洁的中文标签（每个不超过4个字）。

标题：${title || "无标题"}
内容：${(content || "").substring(0, 3000)}

只输出标签本身，用逗号分隔，不要加其他解释。`;

      const result = await callAI(systemPrompt, userPrompt, 500, selectedModel);
      const tagNames = result.split(/[,，、\n]/).map((t) => t.trim()).filter((t: string) => t.length <= 10 && t.length > 0).slice(0, 5);
      return NextResponse.json({ tagNames });
    }

    if (action === "smart-tags") {
      const entry = await prisma.entry.findUnique({
        where: { id: entryId },
        include: { project: { select: { userId: true } } },
      });

      const existingTags = entry ? await prisma.tag.findMany({
        where: { userId: entry.project.userId },
        select: { id: true, name: true },
      }) : [];

      const systemPrompt = "你是一个标签生成助手。每次请求都是全新的，没有任何历史对话。你只根据当前提供的内容生成标签。只输出标签本身，不要输出任何思考过程或解释。";
      const userPrompt = `请根据以下文章的标题和内容，生成 3-5 个简洁的中文标签（每个不超过4个字）。

${existingTags.length > 0 ? `已有的标签有：${existingTags.map((t) => t.name).join("、")}。
优先使用已有的标签，只有当内容确实需要新标签时才创建新标签。避免意思相近的重复标签。` : ""}

标题：${title || "无标题"}
内容：${(content || "").substring(0, 3000)}

只输出标签本身，用逗号分隔，不要加其他解释。`;

      const result = await callAI(systemPrompt, userPrompt, 500, selectedModel);
      const newTagNames = result.split(/[,，、\n]/).map((t) => t.trim()).filter((t: string) => t.length <= 10 && t.length > 0).slice(0, 5);

      const tagIds: string[] = [];
      const usedTagNames: string[] = [];

      for (const name of newTagNames) {
        const exactMatch = existingTags.find((t) => t.name === name);
        if (exactMatch) {
          tagIds.push(exactMatch.id);
          usedTagNames.push(name);
          continue;
        }

        if (existingTags.length > 0) {
          const mergeSystemPrompt = "你是标签合并助手。判断新标签是否与已有标签意思相近。每次请求都是全新的。";
          const mergeUserPrompt = `已有的标签：${existingTags.map((t) => t.name).join("、")}
新标签："${name}"

如果新标签与某个已有标签意思相近（比如"心情"和"感悟"、"日记"和"日常"），输出那个已有标签的名字。
如果没有任何已有标签与之相近，输出"NEW"。
只输出一个结果，不要加其他解释。`;

          const mergeResult = await callAI(mergeSystemPrompt, mergeUserPrompt, 100, selectedModel);
          const mergedName = mergeResult.trim().replace(/[""「」]/g, "");

          if (mergedName !== "NEW" && existingTags.some((t) => t.name === mergedName)) {
            const existingTag = existingTags.find((t) => t.name === mergedName)!;
            tagIds.push(existingTag.id);
            usedTagNames.push(mergedName);
            continue;
          }
        }

        const newTag = await prisma.tag.create({
          data: { name, userId: entry!.project.userId },
        });
        tagIds.push(newTag.id);
        usedTagNames.push(name);
      }

      return NextResponse.json({ tagIds, tagNames: usedTagNames });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 调用失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
