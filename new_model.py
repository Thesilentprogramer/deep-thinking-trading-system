from openai import OpenAI
import json

client = OpenAI(
  base_url="https://integrate.api.nvidia.com/v1",
  api_key="$NVIDIA_API_KEY"
)

completion = client.chat.completions.create(
  model="stepfun-ai/step-3.5-flash",
  messages=[{"role":"user","content":""}],
  temperature=1,
  top_p=0.9,
  max_tokens=16384,
  stream=True
)


for chunk in completion:
  if not getattr(chunk, "choices", None):
    continue
  reasoning = getattr(chunk.choices[0].delta, "reasoning_content", None)
  if reasoning:
    print(reasoning, end="")
  if chunk.choices[0].delta.content:
    print(chunk.choices[0].delta.content, end="")


import requests, base64

invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
stream = True


headers = {
  "Authorization": "Bearer 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",
  "Accept": "text/event-stream" if stream else "application/json"
}

payload = {
  "model": "moonshotai/kimi-k2.5",
  "messages": [{"role":"user","content":""}],
  "max_tokens": 16384,
  "temperature": 1.00,
  "top_p": 1.00,
  "stream": stream,
  "chat_template_kwargs": {"thinking":True},
}



response = requests.post(invoke_url, headers=headers, json=payload)

if stream:
    for line in response.iter_lines():
        if line:
            print(line.decode("utf-8"))
else:
    print(response.json())
