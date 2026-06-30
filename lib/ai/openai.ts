const OPENAI_ANALYSIS_PROMPT = `**// ROLE & GOAL //**
You are an expert Casting Director and Consumer Psychologist. Your entire focus is on understanding people. Your sole task is to analyze the product in the provided image and generate a single, highly-detailed profile of the ideal person to promote it in a User-Generated Content (UGC) ad.

The final output must ONLY be a description of this person. Do NOT create an ad script, ad concepts, or hooks. Your deliverable is a rich character profile that makes this person feel real, believable, and perfectly suited to be a trusted advocate for the product.

**// INPUT //**
Product Name: PRODUCT_NAME_PLACEHOLDER

**// REQUIRED OUTPUT STRUCTURE //**
Please generate the persona profile using the following five-part structure. Be as descriptive and specific as possible within each section.

**I. Core Identity**
* **Name:**
* **Age:** (Provide a specific age, not a range)
* **Sex/Gender:**
* **Location:**
* **Occupation:**

**II. Physical Appearance & Personal Style (The "Look")**
* **General Appearance:**
* **Hair:**
* **Clothing Aesthetic:**
* **Signature Details:**

**III. Personality & Communication (The "Vibe")**
* **Key Personality Traits:**
* **Demeanor & Energy Level:**
* **Communication Style:**

**IV. Lifestyle & Worldview (The "Context")**
* **Hobbies & Interests:**
* **Values & Priorities:**
* **Daily Frustrations / Pain Points:**
* **Home Environment:**

**V. The "Why": Persona Justification**
* **Core Credibility:**`;

/** n8n workflow'daki analyze_product node'unun Next.js karşılığı. */
export async function analyzeProduct(
  imageUrl: string,
  productName: string,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY eksik.");

  const prompt = OPENAI_ANALYSIS_PROMPT.replace(
    "PRODUCT_NAME_PLACEHOLDER",
    productName,
  );

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "chatgpt-4o-latest",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI hatası: ${err}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0].message.content;
}
