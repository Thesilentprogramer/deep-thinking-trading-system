import os
from openai import OpenAI
import json

if not os.environ.get("NVIDIA_API_KEY"):
    raise ValueError("NVIDIA_API_KEY environment variable is missing. Please set it in your .env file.")

client = OpenAI(
  base_url="https://integrate.api.nvidia.com/v1",
  api_key=os.environ["NVIDIA_API_KEY"]
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
  "Authorization": f"Bearer {os.environ['NVIDIA_API_KEY']}",
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
