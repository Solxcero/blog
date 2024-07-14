+++
title = '투자 덕질 : Style Investment(1)'
date = 2024-07-13T09:21:19+09:00
draft = true
tags = []
categories = ["Investment"]
+++

## Style Investment  
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
이 방법론의 핵심은 각 종목에 `가치점수(Value Score)` 와 `성장점수(Growth Score)`을 부여하는 것이다.  
모든 종목에는 가치주의 성격과 성장주의 성격이 혼합되어 있고, 둘 중 어느 쪽에 더 치우쳐져있는지를 판단하겠다는 아이디어라고 보면 된다.  

이 글에서는 문서에서 설명해주는 가치요소 와 성장요소 의 개념을 설명하고 코드 구현은 다음 게시글에 이어서 하도록 하겠다. 

## 성장이 뭐죠? 가치는요?
성장주, 가치주 많이 들어봤지만, 그래서 그게 뭔데? 라고 물어본다면 뭐라 답을 해야할까  

> **성장주** 의 핵심은 미래의 성장 가능성을 높게 평가하고, 주가 상승을 통해 수익을 실현하는 것  

 **성장**을 뭐로 판단하죠  
 - **매출성장** : 기업의 매출이 빠르게 증가하는 경우. 높은 매출 성장률은 시장에서의 수요 증가와 강한 제품 또는 서비스의 경쟁력을 나타냄  
 - **이익성장** : 순이익이 꾸준히 증가하는 기업은 성장 잠재력이 있다고 볼 수 있음. 기업이 효율적으로 운영되고 있다는 뜻으로 볼 수도 있음  
 - **기술 혁신** : 성장주는 보통 기술 혁신을 선도하거나, 새로운 시장 트렌드를 이끄는 기업   
 - **시장 점유율 확대** : 시장 점유율을 빠르게 확장하는 기업들(기술 혁신과 이어지기도 함)
- 예) 높은 매출 성장과 혁신이 이루어지는 테크 산업 기업들 

**성장주의 특징** 은 뭐가 있을까요  
- **고평가** : 현재의 주가가 기업의 본질적인 가치보다 높을 수 있지만, 미래의 성장 가능성을 반영 
- **높은 P/E비율** : 현재 수익에 비해 주가가 높게 평가되지만, 높은 성장 기대치로 인해 투자자들이 감수할 수 있음 
- **낮은 배당금** : 대부분의 수익을 재투자하여 성장을 추구하는 기업이라면 배당금 지급이 적거나 없을 수 있음


> **가치주**의 핵심은 시장의 일시적인 왜곡이나 기업의 잠재력이 반영되지 않는 저평가된 주식을 찾아내어, 주가가 본래의 가치로 회귀할 때 까지 보유함으로써 수익을 실현하는 것 

**가치**를 뭐로 판단하죠  
- **

### Value Factors & Growth Factors  
**Growth Factors**
- Three-Year Net Change in Earnings per Share(Excluding Extra Items) over Current Price
- Three-Year Sales per Share Growth Rate
- Momentum (12 Months % Price Change)

**Value Factors**
- Book Value to Price Ratio
- Earnings To Price Ratio
- Sales to Price Ratio

 
