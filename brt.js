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
  let currentCurationCardIndex = 0;
  let isCurationTransitioning = false;
  let currentIntroFrameIndex = 1;
  let targetIntroFrameIndex = 1;
  const totalIntroFrames = 200;

  function padZero(num, size) {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
  }

  // Preload frames in background to make scroll scrubbing smooth
  const preloadImages = [];
  for (let i = 1; i <= totalIntroFrames; i++) {
    const img = new Image();
    img.src = `img/sjdw_200/ezgif-frame-${padZero(i, 3)}.jpg`;
    preloadImages.push(img);
  }

  function toggleSejongButton(frame) {
    const scrollPrompt = document.getElementById('introScrollPrompt');
    if (scrollPrompt) {
      if (frame <= 15) {
        scrollPrompt.style.opacity = '1';
        scrollPrompt.style.visibility = 'visible';
        scrollPrompt.style.transform = 'translate3d(-50%, 0, 0)';
      } else {
        scrollPrompt.style.opacity = '0';
        scrollPrompt.style.visibility = 'hidden';
        scrollPrompt.style.transform = 'translate3d(-50%, 15px, 0)';
      }
    }

    const btn = document.getElementById('btnSejongShortcut');
    if (btn) {
      if (frame >= 19) {
        btn.style.opacity = '1';
        btn.style.visibility = 'visible';
        btn.style.transform = 'translateY(0)';
      } else {
        btn.style.opacity = '0';
        btn.style.visibility = 'hidden';
        btn.style.transform = 'translateY(10px)';
      }
    }

    // 1) ezgif-frame-043 구간 (35~64): 한글 창제 일자 정보 카드 표출
    const creationCard = document.getElementById('hangeulCreationCard');
    if (creationCard) {
      if (frame >= 35 && frame < 65) {
        creationCard.classList.add('active');
      } else {
        creationCard.classList.remove('active');
      }
    }

    // 2) ezgif-frame-070 구간 (65~139): 창제 일자는 사라지고 훈민정음 해례본 반포 정보 카드 표출
    const promulgateCard = document.getElementById('hangeulPromulgateCard');
    if (promulgateCard) {
      if (frame >= 65 && frame < 140) {
        promulgateCard.classList.add('active');
      } else {
        promulgateCard.classList.remove('active');
      }
    }

    // 3) ezgif-frame-150 구간 (140~): 반포 카드는 사라지고 1940년 해례본 기록 기반 10월 9일 한글날 확정 정보 카드 표출
    const hangeulDayCard = document.getElementById('hangeulHangeulDayCard');
    if (hangeulDayCard) {
      if (frame >= 140) {
        hangeulDayCard.classList.add('active');
      } else {
        hangeulDayCard.classList.remove('active');
      }
    }
  }

  function updateScrubFrame() {
    const diff = targetIntroFrameIndex - currentIntroFrameIndex;
    if (Math.abs(diff) > 0.05) {
      currentIntroFrameIndex += diff * 0.15; // smooth easing factor
      const roundedFrame = Math.round(currentIntroFrameIndex);
      const padded = padZero(roundedFrame, 3);
      const img = document.getElementById('introScrubImg');
      if (img) {
        img.src = `img/sjdw_200/ezgif-frame-${padded}.jpg`;
      }
      toggleSejongButton(roundedFrame);
    } else {
      currentIntroFrameIndex = targetIntroFrameIndex;
      toggleSejongButton(Math.round(currentIntroFrameIndex));
    }
    requestAnimationFrame(updateScrubFrame);
  }
  requestAnimationFrame(updateScrubFrame);

  const sejongModal = document.getElementById('sejongModal');
  const btnSejongModalClose = document.getElementById('btnSejongModalClose');
  const sejongModalOverlay = document.getElementById('sejongModalOverlay');

  function openSejongModal() {
    if (sejongModal) {
      sejongModal.classList.add('active');
    }
  }

  function closeSejongModal() {
    if (sejongModal) {
      sejongModal.classList.remove('active');
    }
  }

  const btnSejongShortcut = document.getElementById('btnSejongShortcut');
  if (btnSejongShortcut) {
    btnSejongShortcut.addEventListener('click', () => {
      openSejongModal();
    });
  }

  if (btnSejongModalClose) {
    btnSejongModalClose.addEventListener('click', closeSejongModal);
  }
  if (sejongModalOverlay) {
    sejongModalOverlay.addEventListener('click', closeSejongModal);
  }

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
  const tabPanels = document.querySelector('.tab-panels');

  window.updateCurationPanel = function(index, force = false) {
    console.log("updateCurationPanel triggered: index =", index, "force =", force, "currentCurationCardIndex =", currentCurationCardIndex, "isCurationTransitioning =", isCurationTransitioning);
    if (index < 0 || index > 2) return;
    if (isCurationTransitioning && !force) {
      console.log("updateCurationPanel early return due to transition lock.");
      return;
    }

    isCurationTransitioning = true;
    currentCurationCardIndex = index;

    // Update tab buttons active class
    tabBtns.forEach((b, idx) => {
      if (idx === index) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    // Translate horizontal panels
    if (tabPanels) {
      console.log("Translating tabPanels to -", index * 33.3333, "%");
      tabPanels.style.transform = `translate3d(-${index * 33.3333}%, 0, 0)`;
    }

    setTimeout(() => {
      isCurationTransitioning = false;
      console.log("isCurationTransitioning set back to false.");
    }, 800);
  };

  tabBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      updateCurationPanel(index, true);
    });
  });

  // 4. 인터랙티브 카드 패럴랙스 틸트 (lhbzr 벤치마크 효과)
  const storyCards = document.querySelectorAll('.story-card');
  storyCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // 미세한 3D 회전 각도 계산 (각도 4도로 줄여 과도한 기울기 방지)
      const rotateX = (-y / (rect.height / 2)) * 4;
      const rotateY = (x / (rect.width / 2)) * 4;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });

    card.addEventListener('mouseleave', () => {
      // 빈 문자열 대신 기준 transform 명시 – is-visible 및 CSS 상태와 충돌 방지
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      // 트랜지션 이후 인라인 스타일 제거하여 CSS 클래스 기반 상태로 복귀
      setTimeout(() => {
        card.style.transform = '';
      }, 600);
    });
  });

  // 5. real_002.mp4 배경 비디오 9초 컷 무한 연속 루프 제어 (영구 무한 재생)
  const video1 = document.getElementById('bgVideo1');
  const video2 = document.getElementById('bgVideo2');
  if (video1) {
    video1.loop = true;
    video1.muted = true;
    video1.playsInline = true;
    video1.autoplay = true;
    video1.setAttribute('loop', '');
    video1.setAttribute('muted', '');
    video1.setAttribute('playsinline', '');
    video1.setAttribute('autoplay', '');

    video1.style.display = 'block';
    video1.style.opacity = '1';
    video1.style.zIndex = '-2';
    video1.style.position = 'absolute';
    video1.style.top = '0';
    video1.style.left = '0';
    video1.style.width = '100%';
    video1.style.height = '100%';
    video1.style.objectFit = 'cover';

    if (video2) {
      video2.style.display = 'none';
      video2.pause();
    }

    // 9.0초 시점에 도달하면 0초로 즉시 리셋하여 영구 무한 루프
    video1.addEventListener('timeupdate', () => {
      if (video1.currentTime >= 9.0) {
        video1.currentTime = 0;
      }
    });

    // 영상 재생이 멈추거나 일시정지되면 즉시 자동 재개
    video1.addEventListener('pause', () => {
      if (document.body.classList.contains('gate-active')) {
        video1.play().catch(() => {});
      }
    });

    video1.play().catch(err => {
      console.log("최초 비디오 자동 재생 제한:", err);
    });

    window.playActiveBgVideo = function() {
      video1.play().catch(err => console.log("비디오 재생 실패:", err));
    };
  }

  // --- 1. Three.js 3D 별무리(Stardust) Canvas 배경 구현 (Vaalentin 2015 Style) ---
  let scene, camera, renderer, starParticles;
  const numStars = 3000;
  const slideZPositions = [1600, 1200, 800, 400, 0]; // 각 슬라이드별 카메라 Z축 깊이 좌표 (5장 슬라이드)

  function initThreeJS() {
    // 3D 별무리 기능 비활성화
    return;
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) return;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.0012); // 원거리 입자 아련한 안개 페이드 아웃

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = slideZPositions[0];

    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 입자 물리 공간 좌표 할당
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(numStars * 3);

    for (let i = 0; i < numStars * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 2000;     // X
      starPositions[i + 1] = (Math.random() - 0.5) * 2000; // Y
      starPositions[i + 2] = (Math.random() - 0.5) * 2000; // Z
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    // 빛을 머금는 가벼운 Additive Blending 입자 스타일 설정
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    starParticles = new THREE.Points(starGeometry, starMaterial);
    scene.add(starParticles);

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 마우스 무브에 반응하는 다이나믹 뷰포트 패럴랙스
    window.addEventListener('mousemove', (e) => {
      const mouseX = (e.clientX / window.innerWidth) - 0.5;
      const mouseY = (e.clientY / window.innerHeight) - 0.5;
      
      gsap.to(camera.position, {
        x: mouseX * 120,
        y: -mouseY * 120,
        duration: 2.2,
        ease: "power2.out",
        overwrite: "auto"
      });
    });

    function animate() {
      requestAnimationFrame(animate);

      // 별무리 먼지가 우주 공간에서 흘러가는 미세 자전 애니메이션
      starParticles.rotation.y += 0.00025;
      starParticles.rotation.x += 0.00012;

      renderer.render(scene, camera);
    }
    animate();
  }

  // --- 1-B. Canvas 2D 별+연결선 파티클 시스템 (Vaalentin 2015 Style - 정보 탭 전용) ---
  (function initParticleSystem() {
    // 2D 파티클 기능 비활성화
    return;
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const NUM_PARTICLES = 120;
    const MAX_DIST = 160;
    const MOUSE_REPEL = 120;
    const BASE_SPEED = 0.35;

    let W, H;
    let mouse = { x: -9999, y: -9999 };
    let particles = [];

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function Particle() {
      this.reset = function() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.vx = (Math.random() - 0.5) * BASE_SPEED * 2;
        this.vy = (Math.random() - 0.5) * BASE_SPEED * 2;
        this.r = Math.random() * 1.6 + 0.6;
        this.alpha = Math.random() * 0.5 + 0.3;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.02 + 0.008;
      };
      this.update = function() {
        this.pulse += this.pulseSpeed;
        const glow = Math.sin(this.pulse) * 0.25;
        this.currentAlpha = Math.max(0.1, Math.min(1, this.alpha + glow));

        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_REPEL && dist > 0) {
          const force = (MOUSE_REPEL - dist) / MOUSE_REPEL;
          this.vx += (dx / dist) * force * 0.8;
          this.vy += (dy / dist) * force * 0.8;
        }

        this.vx *= 0.985;
        this.vy *= 0.985;

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed < BASE_SPEED * 0.5) {
          this.vx += (Math.random() - 0.5) * 0.12;
          this.vy += (Math.random() - 0.5) * 0.12;
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) { this.x = 0; this.vx *= -1; }
        if (this.x > W) { this.x = W; this.vx *= -1; }
        if (this.y < 0) { this.y = 0; this.vy *= -1; }
        if (this.y > H) { this.y = H; this.vy *= -1; }
      };
      this.draw = function() {
        // 금빛 별 점
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(209,180,106,' + this.currentAlpha + ')';
        ctx.fill();

        // 발광 halo
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 4);
        g.addColorStop(0, 'rgba(209,180,106,' + (this.currentAlpha * 0.4) + ')');
        g.addColorStop(1, 'rgba(209,180,106,0)');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      };
      this.reset();
    }

    function init() {
      resize();
      particles = [];
      for (let i = 0; i < NUM_PARTICLES; i++) {
        particles.push(new Particle());
      }
    }

    function drawLines() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const lineAlpha = (1 - dist / MAX_DIST) * 0.35;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(209,180,106,' + lineAlpha + ')';
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
    }

    function loop() {
      ctx.clearRect(0, 0, W, H);
      drawLines();
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', function(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener('mouseleave', function() {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    init();
    loop();
  })();

  // --- 2. 로더 화면 애니메이션 제어 (Vaalentin 2015 Style) ---
  function startLoader() {
    const loader = document.getElementById('loader');
    const progress = document.getElementById('loaderProgress');
    if (!loader) return;

    let percent = 0;
    const interval = setInterval(() => {
      percent += Math.floor(Math.random() * 20) + 15;
      if (progress) progress.style.width = `${Math.min(percent, 100)}%`;

      if (percent >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          loader.classList.add('loaded');
        }, 150);
      }
    }, 30);

    // 비상 안전장치: 최대 800ms 후 무조건 로더 제거하여 멈춤 방지
    setTimeout(() => {
      clearInterval(interval);
      if (loader) loader.classList.add('loaded');
    }, 800);
  }

  // 로더 즉시 실행
  startLoader();


  // --- 3. 풀페이지 슬라이드 & 텍스트 Scatter 인터랙션 구현 ---
  const container = document.getElementById('slidesContainer');
  const slides = Array.from(document.querySelectorAll('#slidesContainer > section'));
  let currentSlideIndex = 0;
  let isTransitioning = false;
  const transitionTime = 1200; // ms

  // 1) 텍스트 분리 유틸리티 및 초기화
  function initScatterText() {
    const targets = document.querySelectorAll(
      '.hero-title, .hero-desc, .hero-sub, ' +
      '.story-section .section-head h2, .story-section .section-head p, ' +
      '.curation-section .section-head h2, .curation-section .section-head p, ' +
      '.gallery-section .section-head h2, .gallery-section .section-head p, ' +
      '.visit-section .visit-info h2, .visit-section .visit-info .tag'
    );

    targets.forEach(target => {
      makeScatterElement(target);
    });
  }

  function makeScatterElement(el) {
    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const fragment = document.createDocumentFragment();
        const words = text.split(/(\s+)/);
        words.forEach(word => {
          if (word.trim() === '') {
            fragment.appendChild(document.createTextNode(word));
          } else {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'scatter-word';
            for (let char of word) {
              const charSpan = document.createElement('span');
              charSpan.className = 'scatter-char';
              charSpan.textContent = char;
              wordSpan.appendChild(charSpan);
            }
            fragment.appendChild(wordSpan);
          }
        });
        node.parentNode.replaceChild(fragment, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'BR') return;
        const childs = Array.from(node.childNodes);
        childs.forEach(child => processNode(child));
      }
    }
    const childs = Array.from(el.childNodes);
    childs.forEach(child => processNode(child));
  }

  // 2) Scatter & Assemble 함수
  function scatterSlide(slide) {
    const chars = slide.querySelectorAll('.scatter-char');
    chars.forEach(char => {
      const x = (Math.random() - 0.5) * 800;
      const y = (Math.random() - 0.5) * 800;
      const z = (Math.random() - 0.5) * 1000 - 200;
      const rotX = (Math.random() - 0.5) * 360;
      const rotY = (Math.random() - 0.5) * 360;
      const rotZ = (Math.random() - 0.5) * 360;

      char.style.transition = 'none';
      char.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
      char.style.opacity = '0';
    });

    const cards = slide.querySelectorAll('.story-card, .product-card');
    cards.forEach(card => {
      card.style.transition = 'none';
      card.style.transform = `translate3d(0px, 120px, -200px) rotateY(${(Math.random() - 0.5) * 20}deg)`;
      card.style.opacity = '0';
    });
  }

  function assembleSlide(slide) {
    const chars = slide.querySelectorAll('.scatter-char');
    chars.forEach((char, i) => {
      const delay = i * 10;
      char.style.transition = 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.2s ease-out';
      char.style.transitionDelay = `${delay}ms`;
      char.offsetHeight;
      char.style.transform = 'translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
      char.style.opacity = '1';
    });

    const cards = slide.querySelectorAll('.story-card, .product-card');
    cards.forEach((card, i) => {
      const delay = 150 + i * 100;
      card.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease-out, border-color 0.6s, background 0.6s, box-shadow 0.6s';
      card.style.transitionDelay = `${delay}ms`;
      card.offsetHeight;
      card.style.transform = 'translate3d(0, 0, 0) scale(1) rotateY(0deg)';
      card.style.opacity = '1';

      setTimeout(() => {
        if (slide.classList.contains('active')) {
          card.style.transform = '';
          card.style.transitionDelay = '';
        }
      }, 900 + delay);
    });
  }

  // 3) 슬라이드 상태 제어기
  function updateSlides() {
    slides.forEach((slide, index) => {
      slide.classList.remove('active', 'prev', 'next');
      if (index === currentSlideIndex) {
        slide.classList.add('active');
        assembleSlide(slide);
      } else if (index < currentSlideIndex) {
        slide.classList.add('prev');
        scatterSlide(slide);
      } else {
        slide.classList.add('next');
        scatterSlide(slide);
      }
    });

    updateHeaderState(currentSlideIndex);
    updateNavLinksActive(currentSlideIndex);
  }

  function goToSlide(index) {
    if (index < 0 || index >= slides.length) return;
    if (isTransitioning) return;

    // Reset intro scroll scrub frame index to 1 when entering the intro slide
    if (index === 0) {
      targetIntroFrameIndex = 1;
      currentIntroFrameIndex = 1;
      const scrubImg = document.getElementById('introScrubImg');
      if (scrubImg) {
        scrubImg.src = `img/sjdw_200/ezgif-frame-001.jpg`;
      }
    }

    // Reset curation horizontal slide index based on entry direction
    if (index === 2) {
      if (currentSlideIndex === 1) {
        if (typeof updateCurationPanel === 'function') {
          updateCurationPanel(0, true);
        }
      } else if (currentSlideIndex === 3) {
        if (typeof updateCurationPanel === 'function') {
          updateCurationPanel(2, true);
        }
      }
    }

    isTransitioning = true;
    currentSlideIndex = index;
    updateSlides();

    if (window.hangeulLeafletMap) {
      setTimeout(() => window.hangeulLeafletMap.invalidateSize(), 400);
    }

    // Three.js 카메라 깊이 Z축 축적 연계 이동 애니메이션
    if (camera) {
      gsap.to(camera.position, {
        z: slideZPositions[index],
        duration: 1.8,
        ease: "power3.inOut"
      });
    }

    setTimeout(() => {
      isTransitioning = false;
    }, transitionTime);
  }

  function updateHeaderState(index) {
    const header = document.querySelector('.header');
    if (!header) return;
    // 슬라이드 모드일 때는 항상 scrolled 클래스를 부여하여 가독성 확보
    header.classList.add('scrolled');
  }

  function updateNavLinksActive(index) {
    const links = document.querySelectorAll('.nav-link');
    links.forEach((link, i) => {
      if (i === index - 1) {
        link.classList.add('active');
        link.style.color = 'var(--highlight)';
      } else {
        link.classList.remove('active');
        link.style.color = '';
      }
    });

    // 우측 도트 인디케이터 상태 연동 업데이트
    const dots = document.querySelectorAll('.slide-indicator .dot');
    dots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  // 4) 마우스 휠 및 모바일 스와이프 핸들러
  window.addEventListener('wheel', (e) => {
    if (document.body.classList.contains('gate-active')) return;

    console.log("Wheel event received. currentSlideIndex =", currentSlideIndex, "isTransitioning =", isTransitioning, "currentCurationCardIndex =", currentCurationCardIndex, "deltaY =", e.deltaY);

    // Intro Slide (index 0) Image Scroll Scrubbing
    if (currentSlideIndex === 0) {
      if (isTransitioning) return;
      const isScrollingDown = e.deltaY > 0;
      if (isScrollingDown) {
        if (targetIntroFrameIndex < totalIntroFrames) {
          targetIntroFrameIndex = Math.min(totalIntroFrames, targetIntroFrameIndex + 6);
          return;
        }
      } else {
        if (targetIntroFrameIndex > 1) {
          targetIntroFrameIndex = Math.max(1, targetIntroFrameIndex - 6);
        }
        return;
      }
    }

    if (currentSlideIndex === 2) {
      if (isTransitioning) {
        console.log("Wheel event ignored because main slide is transitioning.");
        return;
      }
      const isScrollingDown = e.deltaY > 0;
      if (isScrollingDown) {
        if (currentCurationCardIndex < 2) {
          console.log("Scrolling horizontally to next card...");
          updateCurationPanel(currentCurationCardIndex + 1);
          return;
        } else {
          console.log("Reached last horizontal card, proceeding to next slide.");
        }
      } else {
        if (currentCurationCardIndex > 0) {
          console.log("Scrolling horizontally to previous card...");
          updateCurationPanel(currentCurationCardIndex - 1);
          return;
        } else {
          console.log("Reached first horizontal card, proceeding to previous slide.");
        }
      }
    }

    const activeSlide = slides[currentSlideIndex];
    if (activeSlide) {
      const isScrollable = activeSlide.scrollHeight > activeSlide.clientHeight;
      if (isScrollable) {
        const isScrollingDown = e.deltaY > 0;
        const isAtBottom = activeSlide.scrollTop + activeSlide.clientHeight >= activeSlide.scrollHeight - 5;
        const isAtTop = activeSlide.scrollTop <= 5;

        if (isScrollingDown && !isAtBottom) {
          console.log("Slide is scrollable and not at bottom, scrolling vertically inside slide.");
          return;
        }
        if (!isScrollingDown && !isAtTop) {
          console.log("Slide is scrollable and not at top, scrolling vertically inside slide.");
          return;
        }
      }
    }

    if (e.deltaY > 0) {
      console.log("Calling goToSlide to next vertical slide:", currentSlideIndex + 1);
      goToSlide(currentSlideIndex + 1);
    } else {
      console.log("Calling goToSlide to previous vertical slide:", currentSlideIndex - 1);
      goToSlide(currentSlideIndex - 1);
    }
  }, { passive: true });

  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (document.body.classList.contains('gate-active')) return;

    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY - touchEndY;

    // Intro Slide (index 0) Image Touch Swiping Scrubbing
    if (currentSlideIndex === 0 && Math.abs(deltaY) > 30) {
      if (isTransitioning) return;
      const isScrollingDown = deltaY > 0;
      if (isScrollingDown) {
        if (targetIntroFrameIndex < totalIntroFrames) {
          targetIntroFrameIndex = Math.min(totalIntroFrames, targetIntroFrameIndex + 10);
          return;
        }
      } else {
        if (targetIntroFrameIndex > 1) {
          targetIntroFrameIndex = Math.max(1, targetIntroFrameIndex - 10);
        }
        return;
      }
    }

    if (currentSlideIndex === 2 && Math.abs(deltaY) > 50) {
      if (isTransitioning) return;
      const isScrollingDown = deltaY > 0;
      if (isScrollingDown) {
        if (currentCurationCardIndex < 2) {
          updateCurationPanel(currentCurationCardIndex + 1);
          return;
        }
      } else {
        if (currentCurationCardIndex > 0) {
          updateCurationPanel(currentCurationCardIndex - 1);
          return;
        }
      }
    }

    const activeSlide = slides[currentSlideIndex];
    if (activeSlide) {
      const isScrollable = activeSlide.scrollHeight > activeSlide.clientHeight;
      if (isScrollable) {
        const isScrollingDown = deltaY > 0;
        const isAtBottom = activeSlide.scrollTop + activeSlide.clientHeight >= activeSlide.scrollHeight - 5;
        const isAtTop = activeSlide.scrollTop <= 5;

        if (isScrollingDown && !isAtBottom) return;
        if (!isScrollingDown && !isAtTop) return;
      }
    }

    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        goToSlide(currentSlideIndex + 1);
      } else {
        goToSlide(currentSlideIndex - 1);
      }
    }
  }, { passive: true });

  // 5) 상단 내비게이션 & 메가메뉴 링크 클릭 시 해당 슬라이드로 이동 처리
  function handleNavTarget(href) {
    if (document.body.classList.contains('gate-active')) {
      document.body.classList.remove('gate-active');
      if (window.playActiveBgVideo) window.playActiveBgVideo();
    }

    if (href === '#intro' || href === '#hero') {
      goToSlide(0);
    } else if (href === '#story') {
      goToSlide(1);
    } else if (href === '#curation') {
      goToSlide(2);
    } else if (href === '#gallery') {
      goToSlide(3);
    } else if (href === '#visit') {
      goToSlide(4);
    }
  }

  // Header GNB 7대 카테고리 슬라이드 맵핑 (관람안내:4, 전시체험:3, 교육문화:2, 학술연구:1, 소장자료:1, 소식:1, 소개:1)
  const gnbTargetSlides = [4, 3, 2, 1, 1, 1, 1];
  const gnbNavLinks = document.querySelectorAll('.header .nav-link');
  gnbNavLinks.forEach((link, i) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (document.body.classList.contains('gate-active')) {
        document.body.classList.remove('gate-active');
        if (window.playActiveBgVideo) window.playActiveBgVideo();
      }
      const targetSlide = gnbTargetSlides[i] !== undefined ? gnbTargetSlides[i] : 1;
      goToSlide(targetSlide);
      if (megaMenuPanel) megaMenuPanel.classList.remove('active');
    });
  });

  // 메가메뉴 하위 링크 슬라이드 연결 및 드롭다운 닫기
  const megaSubLinks = document.querySelectorAll('.mega-sub a');
  megaSubLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      link.addEventListener('click', (e) => {
        if (link.classList.contains('btn-open-about')) return;
        e.preventDefault();
        handleNavTarget(href);
        if (megaMenuPanel) megaMenuPanel.classList.remove('active');
      });
    }
  });

  const indicatorDots = document.querySelectorAll('.slide-indicator .dot');
  indicatorDots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      if (document.body.classList.contains('gate-active')) {
        document.body.classList.remove('gate-active');
        if (window.playActiveBgVideo) window.playActiveBgVideo();
      }
      goToSlide(idx);
    });
  });

  // 기존 영웅 슬라이드 내부 버튼 바인딩 제거

  // 시스템 초기화
  initThreeJS();
  startLoader();
  initScatterText();
  updateSlides();

  // 7) 게이트 양쪽 네비게이션 버튼 동작 연동
  const btnGateAbout = document.getElementById('btnGateAbout');
  const btnGateCuration = document.getElementById('btnGateCuration');
  const aboutModal = document.getElementById('aboutModal');
  const btnModalClose = document.getElementById('btnModalClose');
  const modalOverlay = document.getElementById('modalOverlay');

  if (btnGateCuration) {
    btnGateCuration.addEventListener('click', () => {
      document.body.classList.remove('gate-active');
      if (window.playActiveBgVideo) {
        window.playActiveBgVideo();
      }
      goToSlide(0); // 한글의 가치 (Story) 탭으로 가장 먼저 활성화 진입 (1 -> 0)
    });
  }

  if (btnGateAbout && aboutModal) {
    btnGateAbout.addEventListener('click', () => {
      aboutModal.classList.add('active');
    });
  }

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

  // 8) 본문 활성화 시 좌측 고정 뒤로가기 버튼 클릭 이벤트
  const btnBackToGate = document.getElementById('btnBackToGate');
  if (btnBackToGate) {
    btnBackToGate.addEventListener('click', () => {
      document.body.classList.add('gate-active');
      currentSlideIndex = 0;
      targetIntroFrameIndex = 1;
      currentIntroFrameIndex = 1;
      const scrubImg = document.getElementById('introScrubImg');
      if (scrubImg) {
        scrubImg.src = `img/sjdw_200/ezgif-frame-001.jpg`;
      }
      updateSlides();
      // 게이트 복귀 시 헤더의 scrolled 클래스 제거
      const header = document.querySelector('.header');
      if (header) header.classList.remove('scrolled');
    });
  }

  // 10) 다국어 번역 시스템 (KR / EN) 컨트롤러
  const langBtns = document.querySelectorAll('.lang-btn');
  
  function setLanguage(lang) {
    langBtns.forEach(btn => {
      if (btn.textContent.trim().toLowerCase() === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const translatableElements = document.querySelectorAll('[data-translate]');
    translatableElements.forEach(el => {
      const key = el.getAttribute('data-translate');
      if (window.translations && window.translations[lang] && window.translations[lang][key]) {
        const textValue = window.translations[lang][key];
        
        if (key.includes('-html')) {
          el.innerHTML = textValue;
        } else {
          el.textContent = textValue;
        }
      }
    });

    initScatterText();
    slides.forEach((slide, idx) => {
      if (idx !== currentSlideIndex) scatterSlide(slide);
    });

    localStorage.setItem('nhm-lang', lang);
  }

  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedLang = btn.textContent.trim().toLowerCase();
      setLanguage(selectedLang);
    });
  });

  const initialLang = localStorage.getItem('nhm-lang') || 'ko';
  setLanguage(initialLang);

  // 11) 하단 맨 위로 가기 버튼 스크롤 이벤트 바인딩
  const btnBackTop = document.querySelector('[data-translate="btn-back-top"]');
  if (btnBackTop) {
    btnBackTop.addEventListener('click', (e) => {
      e.preventDefault();
      goToSlide(0);
    });
  }
  // 12) 헤더 로고 클릭 시 홈 화면(게이트 비디오 단독 모드)으로 복귀
  const headerLogoLink = document.querySelector('.logo a');
  if (headerLogoLink) {
    headerLogoLink.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.classList.add('gate-active');
      currentSlideIndex = 0;
      targetIntroFrameIndex = 1;
      currentIntroFrameIndex = 1;
      const scrubImg = document.getElementById('introScrubImg');
      if (scrubImg) {
        scrubImg.src = `img/sjdw_200/ezgif-frame-001.jpg`;
      }
      updateSlides();
    });
  }

  // 13) Leaflet 기반 국립한글박물관 다크모드 임베디드 지도
  const mapElement = document.getElementById('hangeulMap');
  if (mapElement && typeof L !== 'undefined') {
    const lat = 37.52210;
    const lng = 126.98035;
    
    const map = L.map('hangeulMap', {
      center: [lat, lng],
      zoom: 16,
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: false
    });

    window.hangeulLeafletMap = map;

    // Esri World Dark Gray Base 어두운 지도 타일 레이어 (워터마크 없는 클린 다크모드)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    }).addTo(map);

    // 커스텀 골드 핑 애니메이션 마커
    const goldIcon = L.divIcon({
      className: 'custom-gold-pin-wrapper',
      html: `
        <div class="gold-marker-ping"></div>
        <div class="gold-marker-icon">
          <i class="fa-solid fa-location-dot"></i>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -42]
    });

    const marker = L.marker([lat, lng], { icon: goldIcon }).addTo(map);
    
    // 팝업 설정
    marker.bindPopup(`
      <div class="dark-map-popup">
        <strong>국립한글박물관</strong>
        <p>서울특별시 용산구 서빙고로 139</p>
      </div>
    `);

    // 윈도우 리사이즈 발생 시 지도 크기 자동 재계산
    window.addEventListener('resize', () => {
      setTimeout(() => map.invalidateSize(), 300);
    });
  }

  // 14) 상단 메가메뉴(Megamenu) 토글 및 정확한 Nav 영역 호버 인터랙션 제어
  const btnMegaToggle = document.getElementById('btnMegaToggle');
  const megaMenuPanel = document.getElementById('megaMenuPanel');
  const mainNav = document.querySelector('.header .nav');

  if (megaMenuPanel && mainNav) {
    let hoverTimer = null;

    // 네비 메뉴 영역(.nav)에 마우스가 올라갔을 때만 메가메뉴 표출
    mainNav.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimer);
      megaMenuPanel.classList.add('hover-active');
    });

    mainNav.addEventListener('mouseleave', () => {
      hoverTimer = setTimeout(() => {
        if (!megaMenuPanel.matches(':hover')) {
          megaMenuPanel.classList.remove('hover-active');
        }
      }, 120);
    });

    megaMenuPanel.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimer);
      megaMenuPanel.classList.add('hover-active');
    });

    megaMenuPanel.addEventListener('mouseleave', () => {
      hoverTimer = setTimeout(() => {
        if (!mainNav.matches(':hover')) {
          megaMenuPanel.classList.remove('hover-active');
        }
      }, 120);
    });
  }

  if (btnMegaToggle && megaMenuPanel) {
    btnMegaToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      megaMenuPanel.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!megaMenuPanel.contains(e.target) && !btnMegaToggle.contains(e.target)) {
        megaMenuPanel.classList.remove('active');
        megaMenuPanel.classList.remove('hover-active');
      }
    });
  }

  // 메가메뉴 내부 인사말/조직소개/건축물/연혁 등 클릭 시 박물관 소개 모달 팝업 연결
  const btnOpenAbouts = document.querySelectorAll('.btn-open-about');
  btnOpenAbouts.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (megaMenuPanel) {
        megaMenuPanel.classList.remove('active');
        megaMenuPanel.classList.remove('hover-active');
      }
      if (aboutModal) aboutModal.classList.add('active');
    });
  });
});
