document.addEventListener('DOMContentLoaded', function () {
  const tocLinks = document.querySelectorAll('.toc a'); // TOC 링크
  const sections = [];

  // TOC 링크와 연결된 섹션을 배열에 저장
  tocLinks.forEach(function (link) {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      const targetSection = document.querySelector(href);
      if (targetSection) {
        sections.push({ link: link, section: targetSection });
      }
    }
  });

  // Intersection Observer 설정
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        // 현재 읽고 있는 섹션에 해당하는 TOC 항목 활성화
        const activeLink = sections.find(function (s) {
          return s.section === entry.target;
        }).link;

        tocLinks.forEach(function (link) {
          link.parentElement.classList.remove('active');
        });

        activeLink.parentElement.classList.add('active');
      }
    });
  }, { threshold: 0.5 });

  // 섹션마다 옵저버를 연결
  sections.forEach(function (s) {
    observer.observe(s.section);
  });
});
