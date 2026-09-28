class Stock {
  constructor(symbol, name, market) {
    this.symbol = symbol;
    this.name = name;
    this.market = market;
    this.currentPrice = null;
    this.changePercent = null;
    this.changePrice = null;
    this.lastUpdated = null;
    this.error = null;
    this.consecutiveErrors = 0; // 연속 에러 횟수 추적
    this.buyPrice = null; // 평균 매수가 (1주당)
    this.quantity = null; // 보유 수량
  }

  // 매수가·수량 설정. 0 이하/숫자가 아닌 값은 미설정(null)으로 처리
  setPosition(buyPrice, quantity) {
    const toPositive = (value) => {
      const num = Number(value);
      return Number.isFinite(num) && num > 0 ? num : null;
    };
    this.buyPrice = toPositive(buyPrice);
    this.quantity = toPositive(quantity);
  }

  hasPosition() {
    return this.buyPrice !== null && this.quantity !== null;
  }

  // 현재가 기준 평가손익. 보유 정보나 현재가가 없으면 null
  getProfit() {
    if (!this.hasPosition() || !this.currentPrice) return null;

    const amount = (this.currentPrice - this.buyPrice) * this.quantity;
    const percent = ((this.currentPrice - this.buyPrice) / this.buyPrice) * 100;
    return { amount, percent };
  }

  getProfitStatus() {
    const profit = this.getProfit();
    if (!profit) return 'neutral';
    const amount = this.roundMoney(profit.amount);
    if (amount > 0) return 'positive';
    if (amount < 0) return 'negative';
    return 'neutral';
  }

  // 통화 최소 단위로 반올림 (원: 1원, 달러: 1센트)
  roundMoney(value) {
    if (this.market === 'us') return Math.round(value * 100) / 100;
    return Math.round(value);
  }

  formatMoney(value) {
    const abs = Math.abs(this.roundMoney(value));
    if (this.market === 'us') {
      return `$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${abs.toLocaleString('ko-KR')}원`;
  }

  // 예: "+12,300원 (+3.21%)", "-$4.20 (-1.05%)"
  getFormattedProfit() {
    const profit = this.getProfit();
    if (!profit) return '...';

    const status = this.getProfitStatus();
    const sign = status === 'positive' ? '+' : status === 'negative' ? '-' : '';
    const percentSign = profit.percent > 0 ? '+' : '';
    return `${sign}${this.formatMoney(profit.amount)} (${percentSign}${profit.percent.toFixed(2)}%)`;
  }

  updatePrice(priceData) {
    if (!priceData) return;

    this.currentPrice = priceData.price;
    this.changePercent = priceData.changePercent;
    this.changePrice = priceData.changePrice;
    this.lastUpdated = new Date();
    this.error = null;
    this.consecutiveErrors = 0; // 성공 시 에러 카운터 초기화
  }

  setError(errorMessage) {
    this.error = errorMessage;
    this.consecutiveErrors++; // 에러 발생 시 카운터 증가
    this.lastUpdated = new Date();
  }

  // 상장폐지 가능성 판단 (연속 3회 이상 에러)
  isPossiblyDelisted() {
    return this.consecutiveErrors >= 3;
  }

  getChangeStatus() {
    if (!this.changePercent) return 'neutral';

    const absPercent = Math.abs(this.changePercent);

    if (this.changePercent > 0) {
      if (absPercent >= 10) return 'positive-high';
      if (absPercent >= 5) return 'positive-medium';
      return 'positive';
    }

    if (this.changePercent < 0) {
      if (absPercent >= 10) return 'negative-high';
      if (absPercent >= 5) return 'negative-medium';
      return 'negative';
    }

    return 'neutral';
  }

  getFormattedPrice() {
    if (!this.currentPrice) return '...';

    if (this.market === 'korea') {
      return this.currentPrice.toLocaleString('ko-KR');
    }

    if (this.market === 'us') {
      return `$${this.currentPrice.toFixed(2)}`;
    }

    return this.currentPrice.toFixed(2);
  }

  // 통화 기호 반환
  getCurrencySymbol() {
    if (this.market === 'korea') return '₩';
    if (this.market === 'us') return '$';
    return '';
  }

  // 시장 표시명 반환
  getMarketDisplayName() {
    if (this.market === 'korea') return '한국';
    if (this.market === 'us') return '미국';
    return this.market;
  }

  getFormattedChange() {
    if (this.changePercent === null) return '...';

    // 0%일 때는 화살표와 부호 없이 표시
    if (this.changePercent === 0) {
      return `0.00%`;
    }

    const absPercent = Math.abs(this.changePercent);
    const sign = this.changePercent >= 0 ? '+' : '';

    // 구간별 화살표 개수
    let arrow;
    if (this.changePercent > 0) {
      arrow = absPercent >= 10 ? '▲▲' : '▲';
    } else {
      arrow = absPercent >= 10 ? '▼▼' : '▼';
    }

    return `${arrow} ${sign}${this.changePercent.toFixed(2)}%`;
  }

  getFormattedChangeForMenuBar() {
    if (this.changePercent === null) return '...';

    // 0%일 때는 화살표 없이 표시
    if (this.changePercent === 0) {
      return `0.00%`;
    }

    const absPercent = Math.abs(this.changePercent);

    // 구간별 화살표 개수
    let arrow;
    if (this.changePercent > 0) {
      arrow = absPercent >= 10 ? '▲▲' : '▲';
    } else {
      arrow = absPercent >= 10 ? '▼▼' : '▼';
    }

    const value = absPercent.toFixed(2);

    return `${arrow} ${value}%`;
  }

  getMenuBarText() {
    if (this.error) return `${this.name} ...`;
    if (!this.currentPrice) return `${this.name} ...`;

    const price = this.getFormattedPrice();
    const change = this.getFormattedChangeForMenuBar();
    const currentLine = `${this.name} ${price} ${change}`;
    const profit = this.getProfit();
    if (!profit) return currentLine;

    const sign = this.getProfitStatus() === 'negative' ? '-' : '+';
    const percentSign = profit.percent > 0 ? '+' : '';
    const positionLine = `매수 ${this.formatMoney(this.buyPrice)} 손익 ${sign}${this.formatMoney(profit.amount)} (${percentSign}${profit.percent.toFixed(2)}%)`;
    return `${currentLine}\n${positionLine}`;
  }

  toJSON() {
    return {
      symbol: this.symbol,
      name: this.name,
      market: this.market,
      currentPrice: this.currentPrice,
      changePercent: this.changePercent,
      changePrice: this.changePrice,
      lastUpdated: this.lastUpdated,
      error: this.error,
      consecutiveErrors: this.consecutiveErrors,
      buyPrice: this.buyPrice,
      quantity: this.quantity
    };
  }

  static fromJSON(json) {
    const stock = new Stock(json.symbol, json.name, json.market);
    stock.currentPrice = json.currentPrice;
    stock.changePercent = json.changePercent;
    stock.changePrice = json.changePrice;
    stock.lastUpdated = json.lastUpdated ? new Date(json.lastUpdated) : null;
    stock.error = json.error;
    stock.consecutiveErrors = json.consecutiveErrors || 0;
    stock.setPosition(json.buyPrice, json.quantity);
    return stock;
  }
}

module.exports = Stock;
