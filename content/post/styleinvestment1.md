+++
title = '투자덕질'
date = 2024-07-13T09:21:19+09:00
draft = true
tags = []
categories = ["Investment"]
+++

## 투자에도 덕질이 있다면 그건 인덱스 투자가 아닐까?
내 아이돌 최애의 90%는 그 그룹의 메인보컬이다.  
메인보컬을 좋아하면 행복한 덕질을 보장할 수 있다. 음원으로도 그 멤버의 목소리를 가장 잘 들을 수 있고, 무대 영상에서도 춤추며 열창하는 프로다운 모습을 볼 수 있다.  

<p align="center">
<img src="/images/Investment/jh.jpg" alt="영원한내최애" width="400" >
<em> 나의 영원한 최애 종현옵빠 </em>
</p>


이 처럼 투자도 내가 원하는 스타일로 전략을 짤 수 있다. 내가 선호하는 투자 스타일이 있다면 그에 해당하는 종목들만 가지고 내 포트폴리오를 구성하거나, 나와 비슷한 취향의 사람들이 만들어 놓은 ETF에 투자하면 된다.  

대표적으로는 대형주/중소형주 , 가치주/성장주 , 배당, 퀄리티, 모멘텀 과 같은 스타일이 있다.   
대표적인 ETF로는 iShares S&P 500 Value ETF , Vanguard Growth ETF 가 있다. 

## S&P U.S. Style Indices Methodology
예전에 '포트폴리오 구축'을 주제로 팀프로젝트를 한 적이 있는데, 그 때 
<span style="text-decoration:none; border-bottom:2px solid red;">
    <a href="https://github.com/Solxcero/ubion-3rd/blob/main/Project1/methodology-sp-us-style.pdf" style="text-decoration:none; color:inherit;"  target="_blank">
        S&P U.S. Style Indices Methodology
    </a>
</span>
 문서를 참고하여 파이썬으로 가치/성장 스타일 투자를 구현한 경험이 있다.   
이 방법론의 핵심은 각 종목에 **가치점수(Value Score)** 와 **성장점수(Growth Score)** 을 부여하는 것이다.  
모든 종목에는 가치주의 성격과 성장주의 성격이 혼합되어 있고, 둘 중 어느 쪽에 더 치우쳐져있는지를 판단하겠다는 아이디어라고 보면 된다.  

이 글에서는 문서에서 설명해주는 가치요소 와 성장요소 의 개념을 설명하고 코드 구현은 다음 게시글에 이어서 하도록 하겠다. 

### 성장이 뭐죠? 가치는요?
성장주, 가치주 많이 들어봤지만, 그래서 그게 뭔데? 라고 물어본다면 뭐라 답을 해야할까  

> **성장주** 의 핵심은 미래의 성장 가능성을 높게 평가하고, 주가 상승을 통해 수익을 실현하는 것   

> **가치주**의 핵심은 시장의 일시적인 왜곡이나 기업의 잠재력이 반영되지 않는 저평가된 주식을 찾아내어, 주가가 본래의 가치로 회귀할 때 까지 보유함으로써 수익을 실현하는 것 

이렇게 대답하는게 가장 깔끔해 보인다. 😤

### Value Factors & Growth Factors  

위에서 설명했듯이, 주식의 가치주적 요소와 성장주적인 요소를 점수로 평가 해야하므로 이를 위한 가치 평가 지표, 성장 평가 지표가 있어야 한다.  
아래는 문서에서 제시한 지표이다.   

**Growth Factors**
- Three-Year Net Change in Earnings per Share(Excluding Extra Items) over Current Price
- Three-Year Sales per Share Growth Rate
- Momentum (12 Months % Price Change)

**Value Factors**
- Book Value to Price Ratio
- Earnings To Price Ratio
- Sales to Price Ratio

하나씩 보겠슴다  
1. **Three-Year Net Change in Earnings per Share over Current Price**   
    최근 3년 동안의 주당 순이익(EPS)의 변화를 현재 주가와 비교하는 것이다.   
    현재를 기준으로 계산을 해본다면

$$
 \varphi = 1+\frac{1} {1+\frac{1} {1+\frac{1} {1+\cdots} } }
$$