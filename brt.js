/**
 * 국립한글박물관 인터랙티브 스크립트 (brt.js)
 * - 커스텀 마우스 인터랙션 (lhbzr / vaalentin 스타일)
 * - 헤더 스크롤 감지 및 클래스 제어
 * - 관람객 맞춤 큐레이션 탭 스위칭 UI
 * - 카드 인터랙션 및 패럴랙스 틸트(Tilt) 모션
 * - 스크롤 연동 비디오 프레임 재생 (Scroll Video Scrubbing with Easing)
 * - 스크롤 감지 요소 페이드인 애니메이션 (Scroll Reveal Observer)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. 커스텀 마우스 커서 인터랙션
  const cursorDot = document.getElementById('cursorDot');
  const cursorCircle = document.getElementById('cursorCircle');

  let mouseX = 0;
  let mouseY = 0;
  let circleX = 0;
  let circleY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // 점 커서는 즉각 반영
    if (cursorDot) {
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    }
  });

  // 부드러운 원형 커서 보간 루프 (RAF)
  function renderCursor() {
    circleX += (mouseX - circleX) * 0.12;
    circleY += (mouseY - circleY) * 0.12;

    if (cursorCircle) {
      cursorCircle.style.left = `${circleX}px`;
      cursorCircle.style.top = `${circleY}px`;
    }

    requestAnimationFrame(renderCursor);
  }
  renderCursor();

  // 링크나 버튼에 호버 시 커서 확대 효과
  const interactives = document.querySelectorAll('a, button, .story-card, .product-card');
  interactives.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      document.body.classList.add('cursor-hover');
    });
    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-hover');
    });
  });

  // 2. 스크롤에 따른 헤더 디자인 변화
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });

  // 3. MVP 큐레이션 탭 기능 (가족 / 외국인 코스)
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.panel');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabBtns.forEach((b) => b.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  // 4. 인터랙티브 카드 패럴랙스 틸트 (lhbzr 벤치마크 효과)
  const storyCards = document.querySelectorAll('.story-card');
  storyCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // 미세한 3D 회전 각도 계산
      const rotateX = (-y / (rect.height / 2)) * 6;
      const rotateY = (x / (rect.width / 2)) * 6;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)`;
    });
  });

  // 5. 배경 비디오 Yo-Yo (정방향 <-> 역방향) 무한 반복 제어
  const video = document.getElementById('bgVideo');
  if (video) {
    video.loop = false; // 브라우저 자체 루프는 비활성화 (역재생과 충돌 방지)
    
    let direction = 1; // 1: 정방향 재생, -1: 역방향 재생
    let reverseRafId = null;
    let lastTime = performance.now();
    let lastSeekTime = 0;
    let accumulatedTime = 0;

    function playReverse(now) {
      if (direction !== -1) {
        reverseRafId = null;
        return;
      }

      const elapsed = (now - lastTime) / 1000;
      lastTime = now;
      accumulatedTime += elapsed;

      // 30fps (약 33ms) 간격으로 비디오 탐색(Seek)을 제한적으로 실행하여 
      // 데코더 과부하를 줄이고 버벅임 없는 부드러운 역재생을 구현합니다.
      if (now - lastSeekTime >= 33) {
        let newTime = video.currentTime - accumulatedTime;
        accumulatedTime = 0;
        lastSeekTime = now;

        if (newTime <= 0) {
          newTime = 0;
          video.currentTime = 0;
          direction = 1;
          reverseRafId = null;
          // 즉시 정방향 재생 시작
          video.play().catch(err => {
            console.log("역재생 완료 후 정방향 재생 시작 실패:", err);
          });
        } else {
          video.currentTime = newTime;
        }
      }

      reverseRafId = requestAnimationFrame(playReverse);
    }

    function startReverse() {
      if (direction === -1 && !reverseRafId) {
        lastTime = performance.now();
        lastSeekTime = performance.now();
        accumulatedTime = 0;
        reverseRafId = requestAnimationFrame(playReverse);
      }
    }

    // 영상 재생이 끝에 도달하자마자 즉시 역재생으로 전환하여 끊김 현상 제거
    video.addEventListener('ended', () => {
      if (direction === 1) {
        direction = -1;
        video.pause();
        startReverse();
      }
    });

    // 최초 로드 시 재생 시작 시도
    video.play().catch(err => {
      console.log("비디오 자동 재생이 제한되었습니다.", err);
    });
  }

  // 6. 스크롤 등장 모션 (IntersectionObserver)
  const motionElements = document.querySelectorAll('[data-motion]');
  if ('IntersectionObserver' in window) {
    const motionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          // 한 번 재생 후 관찰 해제 (필요시 주석 처리)
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -10% 0px', // 뷰포트 하단 10% 지점에 진입시 트리거
      threshold: 0.15
    });

    motionElements.forEach((el) => motionObserver.observe(el));
  } else {
    // IntersectionObserver 미지원 브라우저 포백
    motionElements.forEach((el) => el.classList.add('active'));
  }

  // 7. 게이트 양쪽 네비게이션 버튼 동작 연동
  const btnGateAbout = document.getElementById('btnGateAbout');
  const btnGateCuration = document.getElementById('btnGateCuration');
  const aboutModal = document.getElementById('aboutModal');
  const btnModalClose = document.getElementById('btnModalClose');
  const modalOverlay = document.getElementById('modalOverlay');

  // Curation 버튼: 게이트 해제 후 콘텐츠 진입 및 스크롤
  if (btnGateCuration) {
    btnGateCuration.addEventListener('click', () => {
      const targetSelector = btnGateCuration.getAttribute('data-target');
      const targetEl = document.querySelector(targetSelector);
      
      // 게이트 해제 (본문 정보들이 나타남)
      document.body.classList.remove('gate-active');
      
      // 비디오 재생 확인
      const video = document.getElementById('bgVideo');
      if (video && video.paused) {
        video.play().catch(err => console.log("비디오 재생 실패:", err));
      }

      // 해당 섹션으로 부드러운 스크롤 이동
      if (targetEl) {
        setTimeout(() => {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
      }

      // Hero 섹션 모션 트리거
      setTimeout(() => {
        const heroMotions = document.querySelectorAll('#hero [data-motion]');
        heroMotions.forEach(el => el.classList.add('active'));
      }, 300);
    });
  }

  // About 버튼: 게이트 유지한 상태에서 팝업 모달 띄우기
  if (btnGateAbout && aboutModal) {
    btnGateAbout.addEventListener('click', () => {
      aboutModal.classList.add('active');
    });
  }

  // 모달 닫기 이벤트
  function closeAboutModal() {
    if (aboutModal) {
      aboutModal.classList.remove('active');
    }
  }

  if (btnModalClose) {
    btnModalClose.addEventListener('click', closeAboutModal);
  }
  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeAboutModal);
  }
});
