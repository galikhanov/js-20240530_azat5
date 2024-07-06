import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

const Helpers = {
  createElementFromTemplate(template) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = template;
    return tempDiv.firstElementChild;
  },

  createOptionTemplate(id, title, selectedId) {
    const selected = id === selectedId ? 'selected' : '';
    return `<option value="${id}" ${selected}>${title}</option>`;
  },

  deepSet(obj, path, value) {
    if (!Array.isArray(path)) {
      path = path.toString().match(/[^.[\]]+/g) || [];
    }

    path.slice(0, -1).reduce((a, c, i) => {
      if (Object(a[c]) === a[c]) {
        return a[c];
      } else {
        if (Math.abs(path[i + 1]) >> 0 === +path[i + 1]) {
          a[c] = [];
        } else {
          a[c] = {};
        }
        return a[c];
      }
    }, obj)[path[path.length - 1]] = value;

    return obj;
  },

  formDataObject(formData) {
    const root = {};
    for (const [path, value] of formData) {
      this.deepSet(root, path, value);
    }
    return root;
  }
};

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_API_URL = 'https://course-js.javascript.ru/api/rest';

export default class ProductForm {
  subElements = {};

  constructor(productId) {
    this.productId = productId;
  }

  async render() {
    await this._fetchCategories();
    await this._fetchProductData();

    this.element =
      Helpers.createElementFromTemplate(this._createTemplate());

    this._selectSubElements();
    this._createEventListeners();
  }

  async _fetchCategories() {
    const url = `${BACKEND_API_URL}/categories?_sort=weight&_refs=subcategory`;
    this.categories = await fetchJson(url);
  }

  async _fetchProductData() {
    if (this.productId) {
      const url = `${BACKEND_API_URL}/products?id=${this.productId}`;
      const [productData] = await fetchJson(url);
      this.productData = productData;
    } else {
      this.productData = {
        title: '',
        description: '',
        quantity: 1,
        subcategory: this.categories[0].subcategories[0].id,
        status: 1,
        images: [],
        price: 0,
        discount: 0,
      };
    }
  }

  _selectSubElements() {
    this.element.querySelectorAll('[data-element]').forEach(element => {
      this.subElements[element.dataset.element] = element;
    });
  }

  _createTemplate() {
    return `
      <div class="product-form">
        <form data-element="productForm" class="form-grid">
          ${this._createIdInputTemplate()}
          <div class="form-group form-group__half_left">
            <fieldset>
              <label class="form-label">Название товара</label>
              <input required="" type="text" name="title" class="form-control" placeholder="Название товара" value="${escapeHtml(this.productData.title)}">
            </fieldset>
          </div>
          <div class="form-group form-group__wide">
            <label class="form-label">Описание</label>
            <textarea required="" class="form-control" name="description" data-element="productDescription" placeholder="Описание товара">
${escapeHtml(this.productData.description)}
            </textarea>
          </div>
          <div class="form-group form-group__wide" data-element="sortable-list-container">
            <label class="form-label">Фото</label>
            <div data-element="imageListContainer">
              <ul class="sortable-list">
                ${this._createImagesTemplate()}
              </ul>
            </div>
            <button type="button" name="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
          </div>
          <div class="form-group form-group__half_left">
            <label class="form-label">Категория</label>
            <select class="form-control" name="subcategory">
              ${this._createCategoryOptionsTemplate()}
            </select>
          </div>
          <div class="form-group form-group__half_left form-group__two-col">
            <fieldset>
              <label class="form-label">Цена ($)</label>
              <input required="" type="number" name="price" class="form-control" placeholder="100" value="${escapeHtml(this.productData.price.toString())}">
            </fieldset>
            <fieldset>
              <label class="form-label">Скидка ($)</label>
              <input required="" type="number" name="discount" class="form-control" placeholder="0" value="${escapeHtml(this.productData.discount.toString())}">
            </fieldset>
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Количество</label>
            <input required="" type="number" class="form-control" name="quantity" placeholder="1" value="${escapeHtml(this.productData.quantity.toString())}">
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Статус</label>
            <select class="form-control" name="status">
              ${this._createStatusOptionsTemplate()}
            </select>
          </div>
          <div class="form-buttons">
            <button type="submit" name="save" class="button-primary-outline">
              Сохранить товар
            </button>
          </div>
        </form>
      </div>
    `;
  }

  _createIdInputTemplate() {
    if (!this.productId) { return ''; }

    return `<input type="hidden" name="id" value="${this.productId}">`;
  }

  _createImagesTemplate() {
    const items =
      this.productData.images.map(({ url, source }, index) => {
        return `
          <li class="products-edit__imagelist-item sortable-list__item" style="">
            <input type="hidden" name="images[${index}][url]" value="${url}">
            <input type="hidden" name="images[${index}][source]" value="${source}">
            <span>
              <img src="icon-grab.svg" data-grab-handle="" alt="grab">
              <img class="sortable-table__cell-img" alt="Image" src="${url}g">
              <span>${source}</span>
            </span>
            <button type="button">
              <img src="icon-trash.svg" data-delete-handle="" alt="delete">
            </button>
          </li>
        `;
      });

    return items.join("");
  }

  _createStatusOptionsTemplate() {
    const optionsData = [
      { id: 1, title: "Активен" },
      { id: 0, title: "Неактивен" }
    ];

    return (
      optionsData
        .map(({ id, title }) => {
          return Helpers.createOptionTemplate(id, title, this.productData.status);

        })
        .join('')
    );
  }

  _createCategoryOptionsTemplate() {
    const options =
      this
      .categories
      .flatMap(category => {
        return (
          category.subcategories.map(subcategory => {
            const id = subcategory.id;
            const title = `${category.title} > ${subcategory.title}`;
            return Helpers.createOptionTemplate(id, title, this.productData.subcategory);
          })
        );
      });

    return options.join('');
  }

  _handleFormSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(this.subElements.productForm);
    const productData = Helpers.formDataObject(formData);
    const method = this.productId ? 'PATCH' : 'PUT';

    await fetchJson(
      "https://course-js.javascript.ru/api/rest/products",
      {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      }
    );

    switch (method) {
    case 'PATCH':
      this.element.dispatchEvent('product-updated', productData);
      break;
    case 'PUT':
      this.element.dispatchEvent('product-saved', productData);
      break;
    }
  }


  _createEventListeners() {
    this
      .subElements
      .productForm
      .addEventListener('submit', this._handleFormSubmit);
  }

  _destroyEventListeners() {
    this
      .subElements
      .productForm
      .removeEventListener('submit', this._handleFormSubmit);
  }

  destroy() {
    this.element.remove();
    this._destroyEventListeners();
  }
}