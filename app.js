// -------------------------------------------------------------
// 수익률 자동 계산기 - 애플리케이션 로직 (app.js)
// -------------------------------------------------------------

// DOM 요소 참조
const cards = {
  principal: document.getElementById('card-principal'),
  target: document.getElementById('card-target'),
  rate: document.getElementById('card-rate')
};

const inputs = {
  principal: document.getElementById('input-principal'),
  target: document.getElementById('input-target'),
  rate: document.getElementById('input-rate')
};

const badges = {
  principal: document.getElementById('badge-principal'),
  target: document.getElementById('badge-target'),
  rate: document.getElementById('badge-rate')
};

// 스왑 버튼
const btnSwapPrincipalTarget = document.getElementById('swap-principal-target');
const btnSwapTargetRate = document.getElementById('swap-target-rate');

// 제어 버튼
const btnClearAll = document.getElementById('btn-clear-all');
const btnNext = document.getElementById('btn-next');

// 키패드 컨테이너 및 모든 키 버튼
const keypadContainer = document.querySelector('.keypad-grid');

// 애플리케이션 상태 (State)
// 기본 데이터: 원금=1,945,000, 변동금액=2,723,000, 수익률=40
let rawValues = {
  principal: '0',
  target: '0',
  rate: '0'
};

// 입력 순서 이력 관리 (최근 수정된 2개 필드가 입력값(Input)이 되고, 나머지 하나가 결과값(Output)이 됨)
// 초기 설정: 원금과 변동금액이 입력 필드, 수익률이 자동 계산 필드
let inputHistory = ['principal', 'target'];
let focusedField = 'principal'; // 현재 키패드 입력을 받는 필드

// 초기화 함수
function init() {
  setupEventListeners();
  updateUI();
  calculate();
}

// 이벤트 리스너 바인딩
function setupEventListeners() {
  // 1. 카드 선택 이벤트
  Object.keys(cards).forEach(field => {
    cards[field].addEventListener('click', () => {
      setFocus(field);
    });
  });

  // 2. 키패드 입력 이벤트
  keypadContainer.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;
    
    const val = button.dataset.val;
    handleKeyPress(val);
  });

  // 3. 스왑 버튼 이벤트
  btnSwapPrincipalTarget.addEventListener('click', (e) => {
    e.stopPropagation();
    swapValues('principal', 'target');
  });

  btnSwapTargetRate.addEventListener('click', (e) => {
    e.stopPropagation();
    swapValues('target', 'rate');
  });

  // 4. 제어 버튼 이벤트
  btnClearAll.addEventListener('click', clearAll);
  btnNext.addEventListener('click', focusNext);
}

// 포커스 설정
function setFocus(field) {
  focusedField = field;
  
  // 현재 포커스된 필드를 입력 이력의 가장 최근(뒤쪽)으로 이동
  const index = inputHistory.indexOf(field);
  if (index > -1) {
    // 이미 이력에 있으면 순서만 최신으로 변경
    inputHistory.splice(index, 1);
    inputHistory.push(field);
  } else {
    // 이력에 없으면(즉, 기존 자동 계산 필드였으면)
    // 가장 오래된 입력을 이력에서 제거하고 새로운 필드를 추가
    inputHistory.shift();
    inputHistory.push(field);
  }

  updateUI();
}

// 다음 필드로 이동
function focusNext() {
  const fields = ['principal', 'target', 'rate'];
  const currentIndex = fields.indexOf(focusedField);
  const nextField = fields[(currentIndex + 1) % fields.length];
  setFocus(nextField);
}

// 전체 지우기
function clearAll() {
  rawValues = {
    principal: '0',
    target: '0',
    rate: '0'
  };
  inputHistory = ['principal', 'target'];
  focusedField = 'principal';
  updateUI();
  calculate();
}

// 두 필드의 값을 스왑(교환)
function swapValues(field1, field2) {
  const temp = rawValues[field1];
  rawValues[field1] = rawValues[field2];
  rawValues[field2] = temp;

  // 스왑한 필드들을 활성 입력 필드로 설정
  inputHistory = [field1, field2];
  focusedField = field1;

  updateUI();
  calculate();
}

// 키패드 입력 처리
function handleKeyPress(key) {
  let val = rawValues[focusedField];

  switch (key) {
    case 'backspace':
      val = val.slice(0, -1);
      if (val === '' || val === '-') val = '0';
      break;
      
    case 'clear-field':
      val = '0';
      break;
      
    case 'toggle-sign':
      if (val !== '0') {
        if (val.startsWith('-')) {
          val = val.substring(1);
        } else {
          val = '-' + val;
        }
      }
      break;
      
    case '.':
      // 소수점은 한 개만 존재 가능
      if (!val.includes('.')) {
        val += '.';
      }
      break;
      
    case '00':
      if (val !== '0') {
        val += '00';
      }
      break;
      
    case 'enter':
      focusNext();
      return; // 계산은 따로 호출할 필요 없음 (focusNext에서 알아서 UI 갱신됨)
      
    default: // 숫자 0 ~ 9
      if (val === '0') {
        val = key;
      } else {
        val += key;
      }
      break;
  }

  rawValues[focusedField] = val;
  updateUI();
  calculate();
}

// 자동 계산 로직 수행
function calculate() {
  // 활성 입력이 아닌 필드가 자동 계산 대상 필드가 됨
  const allFields = ['principal', 'target', 'rate'];
  const outputField = allFields.find(f => !inputHistory.includes(f));

  const p = parseFloat(rawValues.principal) || 0;
  const t = parseFloat(rawValues.target) || 0;
  const r = parseFloat(rawValues.rate) || 0;

  if (outputField === 'rate') {
    // 수익률(차이%) 계산: (변동금액 - 원금) / 원금 * 100
    if (p !== 0) {
      const calcRate = ((t - p) / p) * 100;
      rawValues.rate = formatComputedValue(calcRate);
    } else {
      rawValues.rate = '0';
    }
  } else if (outputField === 'target') {
    // 변동금액 계산: 원금 * (1 + 수익률 / 100)
    const calcTarget = p * (1 + r / 100);
    rawValues.target = formatComputedValue(calcTarget);
  } else if (outputField === 'principal') {
    // 원금 계산: 변동금액 / (1 + 수익률 / 100)
    if (r !== -100) {
      const calcPrincipal = t / (1 + r / 100);
      rawValues.principal = formatComputedValue(calcPrincipal);
    } else {
      rawValues.principal = '0';
    }
  }

  // 계산 완료 후 화면 갱신
  updateDisplays(outputField);
}

// 계산 결과값 포맷팅 (소수점 최대 4자리까지만 유지하되 불필요한 0 제거)
function formatComputedValue(val) {
  if (isNaN(val) || !isFinite(val)) return '0';
  
  // 한국 원화 단위 특성상 원금과 변동금액은 정수로 반올림 처리
  // 단, 수익률(rate)은 정밀도를 위해 소수점 둘째 자리까지 표시
  const outputField = ['principal', 'target', 'rate'].find(f => !inputHistory.includes(f));
  
  if (outputField === 'rate') {
    return String(Math.round(val * 100) / 100);
  } else {
    // 원금, 변동금액은 정수로 반올림
    return String(Math.round(val));
  }
}

// UI 상태 업데이트
function updateUI() {
  const allFields = ['principal', 'target', 'rate'];
  const outputField = allFields.find(f => !inputHistory.includes(f));

  allFields.forEach(field => {
    const card = cards[field];
    const badge = badges[field];

    // 클래스 초기화
    card.classList.remove('active-input', 'auto-calculated');

    if (field === focusedField) {
      card.classList.add('active-input');
      badge.textContent = '입력 중';
    } else if (field === outputField) {
      card.classList.add('auto-calculated');
      badge.textContent = '자동 계산됨';
    } else {
      badge.textContent = '입력 대기';
    }
  });

  updateDisplays(outputField);
}

// 입력 상자 값 포맷팅 및 표시
function updateDisplays(outputField) {
  // 원금 포맷팅 (천단위 콤마)
  inputs.principal.value = formatNumberWithCommas(rawValues.principal);
  
  // 변동금액 포맷팅 (천단위 콤마)
  inputs.target.value = formatNumberWithCommas(rawValues.target);
  
  // 수익률 표시
  inputs.rate.value = rawValues.rate;

  // 수익률에 따른 텍스트 컬러 지정 (상승: 빨간색, 하락: 파란색, 변동없음: 검정색)
  const rateVal = parseFloat(rawValues.rate) || 0;
  inputs.rate.classList.remove('rate-gain', 'rate-loss', 'rate-neutral');
  
  if (rateVal > 0) {
    inputs.rate.classList.add('rate-gain');
  } else if (rateVal < 0) {
    inputs.rate.classList.add('rate-loss');
  } else {
    inputs.rate.classList.add('rate-neutral');
  }
}

// 천단위 콤마 표시 도우미 함수 (소수점 이하 유지)
function formatNumberWithCommas(valStr) {
  if (!valStr) return '0';
  
  const parts = valStr.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return parts.join('.');
}

// 앱 실행
window.addEventListener('DOMContentLoaded', init);
