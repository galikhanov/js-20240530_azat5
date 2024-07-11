const Helpers = {
  createElementFromTemplate(template) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = template;
    return tempDiv.firstElementChild;
  }
};

export default class RangePicker {
  subElements = {};
  isOpen = false;
  isSelecting = false;

  constructor({ from, to }) {
    this.from = from;
    this.to = to;
    this.element = Helpers.createElementFromTemplate(this._createTemplate());
    this._selectSubElements();
    this._createEventListeners();
  }

  destroy() {
    this._removeEventListeners();
    this.element.remove();
  }

  _toggleSelector() {
    this.element.classList.toggle("rangepicker_open");
    this.isOpen = !this.isOpen;
  }

  _resetDayClasses() {
    let beetwen = false;

    if (this.isSelecting) {
      const highlightedQuery =
        `
          .rangepicker__selected-to,
          .rangepicker__selected-between,
          .rangepicker__selected-from
        `;
      this
        .subElements
        .selector
        .querySelectorAll(highlightedQuery)
        .forEach(element => element.classList = "rangepicker__cell");
    } else {
      this
        .subElements
        .selector
        .querySelectorAll(".rangepicker__cell")
        .forEach(element => {
          const date = new Date(element.dataset.value);

          if (date.getTime() === this.to.getTime()) {
            element.classList.add("rangepicker__selected-to");
            beetwen = false;
          } else {
            element.classList.remove("rangepicker__selected-to");
          }

          if (beetwen) {
            element.classList.add("rangepicker__selected-between");
          } else {
            element.classList.remove("rangepicker__selected-between");
          }

          if (date.getTime() === this.from.getTime()) {
            element.classList.add("rangepicker__selected-from");
            if (this.to) { beetwen = true; }
          } else {
            element.classList.remove("rangepicker__selected-from");
          }
        });
    }
  }

  _handleInputClick = (e) => {
    e.stopPropagation();
    this._toggleSelector();
  }

  _handleDocumentClick = (e) => {
    if (e.target.closest(".rangepicker__selector")) { return; }

    if (this.isOpen) {
      this._toggleSelector();
    }
  }

  _handleSelectorClick = (e) => {
    const target = e.target.closest(".rangepicker__cell");
    if (!target) { return; }

    const date = new Date(target.dataset.value);

    this.isSelecting = !this.isSelecting;
    if (this.isSelecting) {
      this.from = date;
      this.to = null;
    } else {
      this.to = date;
      if (this.from > this.to) {
        [this.from, this.to] = [this.to, this.from];
      }

      this.subElements.input.innerHTML = this._createInputTemplate();
      this._toggleSelector();
    }

    this._resetDayClasses();
  }

  _selectSubElements() {
    this.element.querySelectorAll("[data-element]").forEach(element => {
      this.subElements[element.dataset.element] = element;
    });
  }

  _createEventListeners() {
    this.subElements.input.addEventListener("click", this._handleInputClick);
    this.subElements.selector.addEventListener("click", this._handleSelectorClick);
    document.addEventListener("click", this._handleDocumentClick);
  }

  _removeEventListeners() {
    this.subElements.input.removeEventListener("click", this._handleInputClick);
    this.subElements.selector.removeEventListener("click", this._handleSelectorClick);
    document.removeEventListener("click", this._handleDocumentClick);
  }

  _createTemplate() {
    const nextMonth = new Date(this.from.getFullYear(), this.from.getMonth() + 1);
    return `
      <div class="rangepicker">
        <div class="rangepicker__input" data-element="input">
          ${this._createInputTemplate()}
        </div>
        <div class="rangepicker__selector" data-element="selector">
          <div class="rangepicker__selector-arrow"></div>
          <div class="rangepicker__selector-control-left"></div>
          <div class="rangepicker__selector-control-right"></div>

          ${this._createMonthTemplate(this.from)}
          ${this._createMonthTemplate(nextMonth)}
        </div>
      </div>
    `;
  }

  _createInputTemplate() {
    return `
      <span data-element="from">
        ${this.from.toLocaleDateString()}
      </span>
      -
      <span data-element="to">
        ${this.to.toLocaleDateString()}
      </span>
    `;
  }

  _createDayTemplate(date) {
    const offsert = (date.getDay() + 6) % 7 + 1;
    const style = date.getDate() === 1 ? `--start-from: ${offsert}` : "";
    let selectorClassName = "";

    if (date.getTime() == this.from.getTime()) {
      selectorClassName = "rangepicker__selected-from";
    } else if (date.getTime() == this.to.getTime()) {
      selectorClassName = "rangepicker__selected-to";
    } else if (date > this.from && date < this.to) {
      selectorClassName = "rangepicker__selected-between";
    }

    return `
      <button
        type="button"
        class="rangepicker__cell ${selectorClassName}"
        data-value="${date.toISOString()}"
        style="${style}">
        ${date.getDate()}
      </button>
    `;
  }

  _createDaysTemplate(dayOfMonth) {
    const dayTemplates = [];
    const first = new Date(dayOfMonth.getFullYear(), dayOfMonth.getMonth(), 1);
    const last = new Date(dayOfMonth.getFullYear(), dayOfMonth.getMonth() + 1, 1);
    for (let date = first; date < last; date.setDate(date.getDate() + 1)) {
      dayTemplates.push(this._createDayTemplate(date));
    }
    return dayTemplates.join("");
  }

  _createMonthTemplate(dayOfMonth) {
    const monthName =
      dayOfMonth
        .toLocaleString('default', { month: 'long' });
    return `
      <div class="rangepicker__calendar">
        <div class="rangepicker__month-indicator">
          <time datetime="${monthName}">${monthName}</time>
        </div>
        <div class="rangepicker__day-of-week">
          <div>Пн</div>
          <div>Вт</div>
          <div>Ср</div>
          <div>Чт</div>
          <div>Пт</div>
          <div>Сб</div>
          <div>Вс</div>
        </div>
        <div class="rangepicker__date-grid">
          ${this._createDaysTemplate(dayOfMonth)}
        </div>
      </div>
    `;
  }
}
