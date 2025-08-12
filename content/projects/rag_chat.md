+++
title = '💬streamlit과 RAG를 활용한 챗봇'
date = 2025-08-08T11:00:50+09:00
draft = false
categories = []
+++

요새 RAG에 빠져서 재밌게 공부 중이다.  
배운 내용을 실습하기 위해 나만의 Agent를 하나 만들어 봤다. (물론 교재 참고해서)  

## 개요
streamlit을 사용하여 문서기반 질의응답 RAG 시스템.   
사용자가 문서를 업로드하면 내용을 Embedding 한 후 사용자의 질의에 응답하는 챗봇.

1. 환경: Python 3.12 / FAISS 라이브러리 / Streamlit 라이브러리
2. 모델: gpt-4
3. GtiHub url : [https://github.com/Solxcero/Lang/blob/main/pdfChatApp2.py](https://github.com/Solxcero/Lang/blob/main/pdfChatApp2.py)

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
1. ChatOpenAI : OpenAI의 GPT 모델을 이요해 대화를 처리하는 라이브러리. 질문에 대한 답변을 생성하기 위해 GPT-4 모델을 호출하는 데 사용.
2. FAISS :  벡터DB라이브러리. 임베딩된 벡터를 저장하는 DB를 제공해주는 파이썬 자체 라이브러리
3. OpenAIEmbeddings : OpenAI의 임베딩(벡터화)모델을 사용하는 라이브러리. 문서를 벡터화하여 유사성 검색 지원. 이번 프로젝트에서는 다국어 성능이 좋은 text-embedding-3-large를 사용(but 비싸겠죠)
4. CharacterTextSplitter : 긴 문서를 작은 청크로 나누는 데 사용되는 유틸리티. 
5. ChatMessage, HumanMessage, SystemMessage :  대화형 AI 모델에서 사용할 메시지 유형을 정의하는 스키마. 사용자 질문과 시스템 프롬프트를 GPT 모델로 전달하기 위해 사용.
6. BaseCallbackHandler :  GPT 모델의 응답을 실시간으로 처리할 수 있도록 지원하는 콜백 핸들러를 정의하는 클래스. GPT 모델에서 생성된 토큰을 실시간으로 web UI에 표시하기 위해 사용. 
7. extract_text : PDF 파일에서 텍스트를 추출하는 데 사용되는 고수준 API. 

### MarkDownStreamHandler
Streamlit 마크다운 컨테이너에 생성된 토큰을 실시간으로 스트리밍하는 사용자 정의 핸들러
```python
class MarkdownStreamHandler(BaseCallbackHandler):

    def __init__(self, output_container, initial_content=""):
        self.output_container = output_container 
        self.generated_content = initial_content  

    def on_llm_new_token(self, token: str, **kwargs) -> None:
        self.generated_content += token
        self.output_container.markdown(self.generated_content)
```
- BaseCallbackHandler : 특정 이벤트 발생 시 호출되는 콜백 메서드(on_llm_new_token 등)를 제공하는 핸들러. 주로 LLM과 같은 시스템과 상호작용함. 부모클래스에서 제공하는 메서드를 오버라이드하여 특정 동작(여기서는 마크다운스트리밍)을 구현   

- output_container : 마크다운 표시할 대상
- initial_content : 스트리밍 시작 시 초기화된 상태의 텍스트
- self.output_container : 외부에서 전달도니 출력 컨테이너 객체를 저장
- self.generated_content : 누적된 텍스트 데이터를 저장

- on_llm_new_token 메서드 : 새로운 토큰이 생성될 때마다 호출되며, 생성도니 토큰을 generated_content에 추가

### PDF 처리 함수
```python
def extract_text_from_pdf(file):
    '''pdfminer를 사용하여 PDF 파일에서 텍스트 추출.'''
    try:
        return extract_text(file)
    except Exception as error:
        st.error(f"PDF 텍스트 추출 중 오류 발생: {error}")
        return ""
    

def handle_uploaded_file(file):
    '''업로드 된 PDF 파일을 처리하고 벡터 스토어 준비'''
    if not file:
        return None, None
    
    # 파일 유형에 따라 텍스트 추출
    document_text = extract_text_from_pdf(file) if file.type == 'application/pdf' else ""
    if not document_text:
        st.error("텍스트 추출 불가")
        return None, None
    
    # 문서를 작은 청크로 나누어 벡터화 준비
    text_splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=200
    )

    document_chunks = text_splitter.create_documents([document_text])
    st.info(f"{len(document_chunks)} 개의 문서 단락 생성.")

    # 유사성 검색을 위한 벡터 스토어 생성
    vectorstore = FAISS.from_documents(document_chunks, embedding_model)
    return vectorstore, document_text
```

### RAG 응답 생성 
```python
def get_rag_response(user_query, vectorstore, callback_handler):
    '''검색된 문서를 기바능로 사용자 질문에 대한 응답 생성'''
    if not vectorstore:
        st.error("No Vectorstore. Upload docs first.")
        return ""
    
    # 가장 유사한 문서 3개 검색
    retrieved_docs = vectorstore.similarity_search(user_query, k=3)
    retrieved_text = "\n".join(f"문서 {i+1} : {doc.page_content}" for i, doc in enumerate(retrieved_docs))

    # LLM 설정
    chat_model = ChatOpenAI(model_name = "gpt-4", temperature=0, streaming=True, callbacks=[callback_handler])

    # RAG 프롬프트 
    rag_prompt = [
        SystemMessage(content = "제공된 문서를 기반으로 사용자의 질문에 답변하세요. 정보가 없으면 '모르겠습니다' 라고 답변하세요"),
        HumanMessage(content=f"질문 : {user_query}\n\n{retrieved_text}")

    ]

    try:
        response = chat_model(rag_prompt)
        return response.content
    
    except Exception as error:
        st.error(f"응답 생성 중 오류 발생: {error}")
        return ""
```
- 생성된 응답의 일관성을 높이기 위해 temperature를 0으로 설정 (자유도를 배제한 이성적인 응답)
- callbacks=[callback_handler] : 모델이 출력이 생성될 때마다 callback_handler를 통해 실시간으로 처리 

----
요렇게 주요 함수이며, streamlit UI 및 사용자 쿼리 처리와 같은 전체 소스코드는 깃허브에서 확인할 수 있다.  
GtiHub url : [https://github.com/Solxcero/Lang/blob/main/pdfChatApp2.py](https://github.com/Solxcero/Lang/blob/main/pdfChatApp2.py)

## TEST
내가 테스트할 문서는 2021년에 큰 이슈였던 게임스탑 사태에 대한 보고자료로, 개인 투자자들이 가장 많이 사용했던 증권거래 앱 '로빈후드'에 대한 내용이 담겨있다.  
(개인적으로 게임스탑 사태를 매우 흥미롭게 생각함.)
<p align="center">
  <a href="/images/projects/rag_chat/paper.png" data-lightbox="image-set">
    <img src="/images/projects/rag_chat/paper.png" alt="Your Alt Text" style="width: 450px;" >
  </a>
</p>

이제 Streamlit을 실행해보자. `streamlit run app.py` 로 실행하면 된다.

<p align="center">
  <a href="/images/projects/rag_chat/streamlit_1.png" data-lightbox="image-set">
    <img src="/images/projects/rag_chat/streamlit_1.png" alt="Your Alt Text"style="width: 450px;" >
  </a>
</p>

요렇게 아주 심플한 UI가 나타난다. 내가 원하는 문서를 업로드하면 문서 단락이 몇개가 생성되었는지 표시해준다. (생성 시간은 문서의 길이에 따라 다름)

이제 질문을 해보자. 
문서와 관련된 질문 하나와 관련 없는 질문 하나를 테스트 해보겠다. 
<p align="center">
  <a href="/images/projects/rag_chat/streamlit_2.png" data-lightbox="image-set">
    <img src="/images/projects/rag_chat/streamlit_2.png" alt="Your Alt Text" style="width: 450px;" >
  </a>
</p>

내가 답변을 간결하게 해달라고 조건을 걸어뒀기에 길게 설명을 해주진 않았다.  
문서에서 말하는 매수버튼을 없앤 이유는 나름 잘 요약해서 답변한 듯하다. (~~씨타델 때문이야 씨타델 때문이야~~) 

그리고 김치찌개 레시피는 모른다고 답변을 잘 해주었다. 

## 결론
이렇게 문서 기반 RAG ChatBot을 만들어보았다.  
복잡한 구현 없이 간단한 코드이지만, 그 뒤에 있는 기술은 전혀 간단하지가 않다.  
OpenAI의 고급 LLM 기술을 빌려쓰는 것이기 때문에 결국 다 비용으로 지불해야 한다.  

<p align="center">
  <a href="/images/projects/rag_chat/APIcost.png" data-lightbox="image-set">
    <img src="/images/projects/rag_chat/APIcost.png" alt="Your Alt Text" style="width: 300px;">
  </a>
</p>

이번 테스트에만 사용된 토큰이다.  

비용 측면에서는 '청킹', '프롬프트' 전략을 잘 구성하는 게 중요할 듯 하다. 물론 임베딩 모델도 상황에 맞게 잘 선택해야 한다. 
이 부분에 대해서는 따로 조사를 하고 있다. 기회가 된다면 블로그에도 정리해서 올리도록 하겠다.  


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

