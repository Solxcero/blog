+++
title = '💬streamlit과 RAG를 활용한 챗봇'
date = 2025-08-08T11:00:50+09:00
draft = true
categories = []
+++


## 개요
streamlit을 사용하여 문서기반 질의응답 RAG 시스템.   
사용자가 문서를 업로드하면 내용을 Embedding 한 후 사용자의 질의에 응답하는 챗봇.

1. 환경: Python 3.12 / FAISS 라이브러리 / Streamlit 라이브러리
2. 모델: gpt-4

## 과정
### Library
사용하는 라이브러리들은 아래과 같다.

```python
from dotenv import load_dotenv
from langchain_community.chat_models import ChatOpenAI              
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain.schema import ChatMessage, HumanMessage, SystemMessage
from langchain.callbacks.base  import BaseCallbackHandler
from pdfminer.high_level import extract_text
import streamlit as st
import os
```
주요 라이브러리 설명   
1. `ChatOpenAI` : OpenAI의 GPT 모델을 이요해 대화를 처리하는 라이브러리. 질문에 대한 답변을 생성하기 위해 GPT-4 모델을 호출하는 데 사용.
2. `FAISS` :  벡터DB라이브러리. 임베딩된 벡터를 저장하는 DB를 제공해주는 파이썬 자체 라이브러리
3. `OpenAIEmbeddings` : OpenAI의 임베딩(벡터화)모델을 사용하는 라이브러리. 문서를 벡터화하여 유사성 검색 지원.
4. `CharacterTextSplitter` : 긴 문서를 작은 청크로 나누는 데 사용되는 유틸리티. 
5. `ChatMessage`, `HumanMessage`, `SystemMessage` :  대화형 AI 모델에서 사용할 메시지 유형을 정의하는 스키마. 사용자 질문과 시스템 프롬프트를 GPT 모델로 전달하기 위해 사용.
6. `BaseCallbackHandler` :  GPT 모델의 응답을 실시간으로 처리할 수 있도록 지원하는 콜백 핸들러를 정의하는 클래스. GPT 모델에서 생성된 토큰을 실시간으로 web UI에 표시하기 위해 사용. 
7. `extract_text` : PDF 파일에서 텍스트를 추출하는 데 사용되는 고수준 API. 




## Debug Log
1. Pydantic Error

    ```shell
    PydanticUserError: `OpenAI` is not fully defined; you should define `BaseCache`, then call `OpenAI.model_rebuild()`.
    ```
    pydantic 버전이 2.11.0 이상이 설치된 경우에 langchain 모듈과 호환이 안되는 문제가 발생할 수 있음. 

    해결 : 버전 맞춰주기
    ```shell
    pip install langchain-core==0.3.0 langchain-openai==0.2.0 pydantic==2.10.6
    ```

