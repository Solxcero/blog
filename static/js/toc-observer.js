document.addEventListener('DOMContentLoaded', function () {
  const tocLinks = document.querySelectorAll('.toc a');
  const sections = [];

  tocLinks.forEach(function (link) {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      const targetSection = document.querySelector(href);
      if (targetSection) {
        sections.push({ link: link, section: targetSection });
      }
    }
  });

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      console.log("📍 감지된 섹션:", entry.target.id, " / 감지 상태:", entry.isIntersecting);

      if (entry.isIntersecting) {
        const activeLink = sections.find(function (s) {
          return s.section === entry.target;
        }).link;

        tocLinks.forEach(function (link) {
          link.parentElement.classList.remove('active');
        });

        activeLink.parentElement.classList.add('active');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: "-80px 0px 0px 0px"
  });

  sections.forEach(function (s) {
    observer.observe(s.section);
  });

  // fallback: 맨 위 섹션 활성화
  if (sections.length > 0) {
    sections[0].link.parentElement.classList.add('active');
  }
});
