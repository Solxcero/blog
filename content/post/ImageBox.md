+++
title = '포스팅 이미지 팝업으로 보기'
date = 2024-05-03T10:41:44+09:00
tags = []
categories = ["blog"]
+++

네이버나 티스토리 블로그의 주요 기능 중에 하나가 이미지를 클릭하면 이미지가 팝업으로 뜨는 효과이다.   
Hugo 의 경우 이미지를 넣을 때 html의 a 태그를 사용하여 새로운 링크로 이미지를 띄울 수 있긴한데, 나는 팝업 효과를 원했다. 

그래서 내가 직접 기능을 추가해보려고 한다.  
사실 아직 Hugo 구조를 잘 몰라서..ㅋㅎㅎㅎ GPT의 도움을 받았다.

## head.html에 Lightbox Library 추가하기
**Ligthbox**가 이미지를 띄워주는 기능인가 보다.  
작업 파일의 경로는 `layouts > partials > head.html`의 `<head>` 태그 안에 아래 코드를 넣어주면 된다. 
```html
<link href="https://cdnjs.cloudflare.com/ajax/libs/lightbox2/2.11.3/css/lightbox.min.css" rel="stylesheet" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/lightbox2/2.11.3/js/lightbox-plus-jquery.min.js"></script>
```

head.html이 아닌 baseof.html 에 넣어도 작동한다. 

## 포스팅에 이미지 파일 넣기 
그냥 이미지를 넣는 방법은 아래와 같다. 
```html
<p align="center">
    <img src="/images/DailyCoding/puppy.png" alt="이미지박스 테스트" width="300">
    <em> 귀요미들 </em>
</p>
```
<p align="center">
    <img src="/images/DailyCoding/puppy.png" alt="이미지박스 테스트" width="300">
    <em> 귀요미들 </em>
</p>

이번에는 이미지 팝업 효과를 추가해보겠당

```html
<p align="center">
  <a href="/images/DailyCoding/puppy.png" data-lightbox="image-set">
    <img src="/images/DailyCoding/puppy.png" alt="Your Alt Text" style="width: 300px;">
  </a>
  <em>귀요미들</em>
</p>
```
<p align="center">
  <a href="/images/DailyCoding/puppy.png" data-lightbox="image-set">
    <img src="/images/DailyCoding/puppy.png" alt="Your Alt Text" style="width: 300px;">
  </a>
  <em>귀요미들</em>
</p>

## 만족하나? 
사실 귀찮다..
마크다운 문법으로 이미지를 넣으면 크기랑 정렬을 맞출 수가 없어 html로 이미지를 넣고 있는데, 클래스로 만들어서 넣는 모든 이미지에 효과가 적용되게 하고 싶은데 귀찮으니까 우선 여기서 멈춰야지. 
근데 이거 이미지 팝업창 뜨는 속도 왜 느리지ㅠ
