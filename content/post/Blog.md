+++
title = 'Hugo로 GitBlog 만들기'
date = 2024-04-03T10:41:44+09:00
tags = []
categories = ["blog"]
+++

## Hugo 블로그. 
깃허브 블로그 테마 유목민이던 내가 드디어 맘에 드는 테마를 발견했는데, 기존에 사용하던 Jekyll가 아닌 Hugo 기반이다.  
Hugo는 처음이기 때문에 공부도 하고, 혹시나 복기가 필요할 때 참고하기 위해 포스팅을 하려고 한다. 
[Hugo Documentation](https://gohugo.io/documentation/)

## Hugo 설치
(Windows 기준)  
1. [hugo release](https://github.com/gohugoio/hugo/releases) 에서 가장 최신 버전을 다운받는다.
2. 로컬PC에 Hugo 프로젝트 파일을 담을 폴더를 생성 (`C:/Hugo`) 
3. `C:/Hugo/bin` 디렉토리 생성 후 설치 파일 압축 해제 하여 넣기
4. `C:/Hugo/bin` 환경변수에 추가 -> cmd에 ` hugo version ` 입력하여 Path 추가 되었는지 확인

## Hugo Local 실행
**1. 프로젝트 폴더 만들기**
 ```bash
$ hugo new site blog
# blog는 프로젝트 이름
 # blog 폴더 안에 Hugo 기본 구조 생성된 것 확인 
```
**2. 원하는 Hugo 테마 선택**
```bash
$ git clone https://github.com/nanxiaobei/hugo-paper.git themes/paper
# 나는 hugo-paper 테마 선택
# 프로젝트의 하위 폴더인 themes 폴더 안에  paper 라는 이름으로 clone    
``` 
**3. hugo.toml 파일 수정**  
해당 테마 공식 깃허브에 가면 hugo.toml(config 파일)을 어떻게 사용하면 되는지 나와 있음.  
모든 Hugo Project에서 중요한 것은 사용할 테마 이름을 지정하는 것.
```txt
theme = "paper"
```
즉, hugo는 여러 테마를 다운받아서 원하는 테마로 바꾸면서 사용할 수 있는데, 이때 config 파일인 hugo.toml에 어떤 테마를 사용할 것인지 지정을 해주는 단계   

**4. 글 작성**  
```bash
$ hugo new <게시글제목>.md
```
프로젝트 경로의 `contents` 폴더 안에 포스팅 생성 확인  
`post/test.md` -> post라는 범주 안에 test 게시글 작성  

**5. 로컬서버로 미리보기**  
```bash
$ hugo server -D
```
`localhost:1313` 혹은 `127.0.0.1:1313` 으로 접속해 확인 

## Build 단계
**1. Github Repo 생성**  
<프로젝트이름>의 저장소 하나와, <깃허브ID.github.io> 저장소 하나 생성  
나의 경우 `blog` 와 `Solxcero.github.io`  

**2. 프로젝트 폴더 remote**  
! 프로젝트 폴더 안에  `public` 폴더가 있다면 삭제 필수 !  
`C:/Hugo/blog` 프로젝트 경로에서 
```bash
$ git init
$ git remote add origin <프로젝트 Repo url>
```

**3. gihub page 폴더 submodule**  
프로젝트 폴더 remote 후 생성 된 `public` 폴더 안에 github.io repo를 연결 
```bash
$ git submodule add -b main <github.io repository url> public
```

**4. 빌드** 
```bash
$ hugo -t paper
```
`public` 폴더 안에 내가 선택한 테마의 빌드 결과 확인 가능 

**5. 커밋하기**
```bash
$ cd public
$ git add .
$ git commit -m "<커밋 메세지>"
$ git push origin main
$ cd ..
$ git add .
$ git commit -m "<커밋 메세지>"
$ git push origin main
```

## 쉘스크립트 만들기 
Jekyll와 달리 Hugo는 `public` 과 `프로젝트`를 각각 빌드해야하므로 과정이 조금 귀찮다. 
프로젝트 폴더 안에 `deploy.sh` 이름의 쉘스크립트를 만들어서 빌드 과정을 자동화할 수 있음
```sh
#!/bin/sh
# If a command fails then the deploy stops
set -e
printf "\033[0;32mDeploying updates to GitHub...\033[0m\n"
# Build the project.
hugo -t paper
# Go To Public folder
cd public
# Add changes to git.
git add .
# Commit changes.
msg="rebuilding site $(date)"
if [ -n "$*" ]; then
	msg="$*"
fi
git commit -m "$msg"
# Push source and build repos.
git push origin main
cd ..
# anyblogname 업데이트
git add .
msg="rebuilding site `date`"
if [ $# -eq 1 ]
  then msg="$1"
fi
git commit -m "$msg"
git push origin main
```
테마 이름만 본인이 사용하는 이름으로 수정하면 됨.   
Windows는 쉘스크립트를 실행할 수 없으므로 `gitbash`를 사용하면 됨.
프로젝트 폴더 경로에서 다음 명령어 실행 
```bash
$ ./deploy.sh "commit message"
```

