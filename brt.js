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

  // 5. 배경 비디오 듀얼 크로스페이드 Seamless 루프 제어
  const video1 = document.getElementById('bgVideo1');
  const video2 = document.getElementById('bgVideo2');
  if (video1 && video2) {
    let videos = [video1, video2];
    let activeIdx = 0;
    let transitionDuration = 0.8; // 교차 페이드 전환 시간 (초)
    let isTransitioning = false;

    // 초기 설정 강제 동기화
    videos.forEach((vid, idx) => {
      vid.loop = false; // 브라우저 자체 루프는 끄고 JS로 정밀 제어
      vid.muted = true;
      vid.playsInline = true;
      vid.setAttribute('autoplay', idx === 0 ? 'autoplay' : '');
      vid.style.transition = 'opacity 0.8s ease';
      vid.style.position = 'absolute';
      vid.style.top = '0';
      vid.style.left = '0';
    });

    function checkVideoProgress() {
      const activeVideo = videos[activeIdx];
      const inactiveVideo = videos[1 - activeIdx];

      if (activeVideo.duration) {
        const duration = activeVideo.duration;
        const current = activeVideo.currentTime;

        // 종료 0.8초 전에 교차 페이드 시작
        if (!isTransitioning && current >= duration - transitionDuration) {
          isTransitioning = true;

          // 대기 동영상을 처음부터 재생 시작
          inactiveVideo.currentTime = 0;
          inactiveVideo.play().then(() => {
            inactiveVideo.style.opacity = '1';
            inactiveVideo.style.zIndex = '-2';
            activeVideo.style.opacity = '0';
            activeVideo.style.zIndex = '-3';

            setTimeout(() => {
              activeVideo.pause();
              activeIdx = 1 - activeIdx;
              isTransitioning = false;
            }, transitionDuration * 1000);
          }).catch(err => {
            console.log("교체 비디오 재생 실패:", err);
            isTransitioning = false;
          });
        }
      }
      requestAnimationFrame(checkVideoProgress);
    }

    if (video1.readyState >= 1) {
      requestAnimationFrame(checkVideoProgress);
    } else {
      video1.addEventListener('loadedmetadata', () => {
        requestAnimationFrame(checkVideoProgress);
      });
    }

    video1.play().catch(err => {
      console.log("최초 비디오 재생 제한:", err);
    });

    // 외부 연동용 헬퍼 함수
    window.playActiveBgVideo = function() {
      videos[activeIdx].play().catch(err => console.log("비디오 재생 실패:", err));
    };
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
      if (window.playActiveBgVideo) {
        window.playActiveBgVideo();
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

  // 8. 본문 활성화 시 좌측 고정 뒤로가기 버튼 클릭 이벤트
  const btnBackToGate = document.getElementById('btnBackToGate');
  if (btnBackToGate) {
    btnBackToGate.addEventListener('click', () => {
      // 본문을 숨기고 게이트(동영상 단독 모드)를 다시 활성화
      document.body.classList.add('gate-active');
      
      // 최상단으로 스크롤 이동
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }


  // 10. 다국어 번역 시스템 (KR / EN) 컨트롤러
  const langBtns = document.querySelectorAll('.lang-btn');
  
  function setLanguage(lang) {
    // 버튼 활성화 스타일 적용
    langBtns.forEach(btn => {
      if (btn.textContent.trim().toLowerCase() === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 다국어 텍스트 번역 데이터 매핑 루프
    const translatableElements = document.querySelectorAll('[data-translate]');
    translatableElements.forEach(el => {
      const key = el.getAttribute('data-translate');
      if (window.translations && window.translations[lang] && window.translations[lang][key]) {
        const textValue = window.translations[lang][key];
        
        // 키값에 html 수식어가 들어가 있다면 innerHTML로 삽입하여 태그 파싱
        if (key.includes('-html')) {
          el.innerHTML = textValue;
        } else {
          el.textContent = textValue;
        }
      }
    });

    // 유저의 선호 언어 브라우저 로컬 저장소 캐싱
    localStorage.setItem('nhm-lang', lang);
  }

  // 클릭 이벤트 리스너 등록
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedLang = btn.textContent.trim().toLowerCase(); // 'ko' or 'en'
      setLanguage(selectedLang);
    });
  });

  const initialLang = localStorage.getItem('nhm-lang') || 'ko';
  setLanguage(initialLang);
  // 11. 하단 맨 위로 가기 버튼 스크롤 이벤트 바인딩
  const btnBackTop = document.querySelector('[data-translate="btn-back-top"]');
  if (btnBackTop) {
    btnBackTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
