+++
title = 'Style Index를 만들어보장'
date = 2024-07-13T09:21:19+09:00
draft = true
tags = []
categories = ["Investment"]
+++

## S&P U.S. Style Indices Methodology
예전에 '포트폴리오 구축'을 주제로 팀프로젝트를 한 적이 있는데, 그 때 
<span style="text-decoration:none; border-bottom:3px solid red; font-weight:bold;">
    <a href="https://github.com/Solxcero/ubion-3rd/blob/main/Project1/methodology-sp-us-style.pdf" style="text-decoration:none; color:inherit;"  target="_blank">
        S&P U.S. Style Indices Methodology
    </a>
</span>
 문서를 참고하여 파이썬으로 가치/성장 스타일 투자를 구현한 경험이 있다.   
이 방법론의 핵심은
>**모든 종목에는 가치주의 성격과 성장주의 성격이 혼합되어 있고, 둘 중 어느 쪽에 더 치우쳐져있는지를 가치점수(Value Score) 와 성장점수(Growth Score)판단하겠다는 아이디어** 

라고 보면 된다.  

### 성장이 뭐죠? 가치는요?

**성장주**의 핵심은 미래의 성장 가능성을 높게 평가하고, 주가 상승을 통해 수익을 실현하는 것   

**가치주**의 핵심은 시장의 일시적인 왜곡이나 기업의 잠재력이 반영되지 않는 저평가된 주식을 찾아내어, 주가가 본래의 가치로 회귀할 때 까지 보유함으로써 수익을 실현하는 것 

이렇게 대답하는게 가장 깔끔해 보인다. 😤

### Value Factors & Growth Factors  

위에서 설명했듯이, 주식의 가치주적 요소와 성장주적인 요소를 점수로 평가 해야하므로 이를 위한 가치 평가 지표, 성장 평가 지표가 있어야 한다.  
아래는 문서에서 제시한 지표이다.   

#### **Growth Factors**
- **Three-Year Net Change in Earnings per Share(Excluding Extra Items) over Current Price**  
    최근 3년 동안의 주당 순이익(EPS)의 변화를 현재 주가와 비교하는 것이다.   
    해당 지표 값이 높을수록 회사의 성장 잠재력이 높다고 평가할 수 있다.  
    피터린치가 만든 PEG의 역수이다. 

- **Three-Year Sales per Share Growth Rate**  
    최근 3년 동안의 주당 매출 성장률을 의미한다.  
    회사의 매출이 주당 기준으로 얼마나 증가했는지 판단할 수 있으며, 해당 값이 높을수록 회사가 빠르게 성장하고 있음을 시사한다.  

- **Momentum (12 Months % Price Change)**  
    최근 12개월 동안의 주가 변동률을 나타낸다. 
    투자자들이 주식의 최근 성과를 평가할 때 주로 사용하며 높은 모멘텀은 주가가 상승 추세에 있음을 보여준다. 

#### **Value Factors**
- **Book Value to Price Ratio**  
    회사의 장부 가치(Book Value)를 현재 주가로 나눈 비율이다. 
    이때 장부 가치는 회사의 순자산(자산-부채)으로 계산되며, 이 비율이 높을수록 주식이 저평가 되어있을 가능성이 높다.  
    PBR의 역수이다. 

- **Earnings To Price Ratio**  
    회사의 주당 순이익(EPS)을 현재 주가로 나눈 비율이다.  
    주가 대비 순이익 비율(P/E 비율의 역수)로 이 비율이 높을수록 주식이 저평가 되었음을 의미한다.    
    PER의 역수이다. 

- **Sales to Price Ratio**  
    회사의 주당 매출을 현재 주가로 나눈 비율이다. 
    주가 대비 매출 비율로, 이 비율이 높을수록 주식이 저평가되었을 가능성이 있다. 


