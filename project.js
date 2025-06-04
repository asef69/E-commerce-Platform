let cartItems = [];

document.addEventListener('DOMContentLoaded', function() {
    loadAllProducts();
    setupEventListeners();
});

function loadAllProducts() {
    const productContainer = document.getElementById('product-container');
    productContainer.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading products...</p>
        </div>
    `;

    fetch("https://fakestoreapi.com/products")
        .then(res => res.json())
        .then(products => {
            productContainer.innerHTML = '';
            displayProducts(products);
        })
        .catch(err => {
            productContainer.innerHTML = '<p class="empty-cart">Failed to load products. Please try again later.</p>';
            console.error(err);
        });
}

function displayProducts(products) {
    const productContainer = document.getElementById('product-container');

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.title}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <span class="product-category">${product.category}</span>
                <div class="product-rating">
                    <div class="stars">
                        ${generateStarRating(product.rating.rate)}
                    </div>
                    <span class="rating-count">(${product.rating.count})</span>
                </div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-actions">
                    <button class="add-to-cart" data-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                    <button class="view-details" data-id="${product.id}">
                        <i class="fas fa-eye"></i> Details
                    </button>
                </div>
            </div>
        `;
        productContainer.appendChild(productCard);
    });
}

function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    return '<i class="fas fa-star"></i>'.repeat(fullStars) + 
           (halfStar ? '<i class="fas fa-star-half-alt"></i>' : '') + 
           '<i class="far fa-star"></i>'.repeat(emptyStars);
}

function setupEventListeners() {
    document.getElementById('cart-link').addEventListener('click', toggleCart);
    document.getElementById('close-cart').addEventListener('click', toggleCart);
    document.getElementById('cart-overlay').addEventListener('click', toggleCart);
    document.getElementById('checkout-btn').addEventListener('click', openCheckoutModal);
    document.getElementById('close-checkout').addEventListener('click', closeCheckoutModal);
    document.querySelector('.hamburger').addEventListener('click', toggleMobileMenu);

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart')) {
            const productId = e.target.getAttribute('data-id');
            addToCart(productId);
        }
        if (e.target.classList.contains('view-details')) {
            const productId = e.target.getAttribute('data-id');
            viewProductDetails(productId);
        }
    });

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', filterProductsByCategory);
    });

    document.getElementById('search-btn').addEventListener('click', searchProducts);
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchProducts();
    });

    document.getElementById('checkout-form').addEventListener('submit', placeOrder);
}

function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('active');
    document.getElementById('cart-overlay').classList.toggle('active');
    updateCartUI();
}

function toggleMobileMenu() {
    document.querySelector('.nav-links').classList.toggle('active');
}

function addToCart(productId) {
    fetch(`https://fakestoreapi.com/products/${productId}`)
        .then(res => res.json())
        .then(product => {
            const existingItem = cartItems.find(item => item.id === product.id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cartItems.push({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image: product.image,
                    quantity: 1
                });
            }
            updateCartCount();
            showNotification(`${product.title.slice(0, 20)} added to cart!`);
        });
}

function updateCartCount() {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartGrandTotal = document.getElementById('cart-grand-total');

    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartSubtotal.textContent = '$0.00';
        cartGrandTotal.textContent = '$5.99';
        return;
    }

    cartItemsContainer.innerHTML = '';
    let subtotal = 0;

    cartItems.forEach(item => {
        subtotal += item.price * item.quantity;
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="cart-item-image">
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.title}</h4>
                <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                <div class="cart-item-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                        <input type="text" class="quantity-input" value="${item.quantity}" readonly>
                        <button class="quantity-btn increase" data-id="${item.id}">+</button>
                    </div>
                    <button class="remove-item" data-id="${item.id}">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    cartGrandTotal.textContent = `$${(subtotal + 5.99).toFixed(2)}`;

    document.querySelectorAll('.decrease').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            updateCartItemQuantity(id, -1);
        });
    });

    document.querySelectorAll('.increase').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            updateCartItemQuantity(id, 1);
        });
    });

    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            removeFromCart(id);
        });
    });
}

function updateCartItemQuantity(id, change) {
    const item = cartItems.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cartItems = cartItems.filter(item => item.id !== id);
        }
        updateCartCount();
        updateCartUI();
    }
}

function removeFromCart(id) {
    cartItems = cartItems.filter(item => item.id !== id);
    updateCartCount();
    updateCartUI();
    showNotification('Item removed from cart');
}

function viewProductDetails(productId) {
    fetch(`https://fakestoreapi.com/products/${productId}`)
        .then(res => res.json())
        .then(product => {
            const modalBody = document.getElementById('modal-body');
            modalBody.innerHTML = `
                <img src="${product.image}" alt="${product.title}" class="modal-product-image">
                <h2 class="modal-product-title">${product.title}</h2>
                <span class="modal-product-category">${product.category}</span>
                <div class="modal-product-rating">
                    ${generateStarRating(product.rating.rate)}
                    <span>(${product.rating.count} reviews)</span>
                </div>
                <div class="modal-product-price">$${product.price.toFixed(2)}</div>
                <p class="modal-product-description">${product.description}</p>
                <div class="modal-actions">
                    <button class="modal-add-to-cart" data-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            `;
            document.getElementById('product-modal').classList.add('active');
            
            document.querySelector('.modal-add-to-cart').addEventListener('click', function() {
                addToCart(product.id);
                document.getElementById('product-modal').classList.remove('active');
            });
        });

    document.getElementById('close-modal').addEventListener('click', function() {
        document.getElementById('product-modal').classList.remove('active');
    });
}

function filterProductsByCategory(e) {
    const category = e.target.getAttribute('data-category');
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');

    if (category === 'all') {
        loadAllProducts();
        return;
    }

    const productContainer = document.getElementById('product-container');
    productContainer.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading products...</p>
        </div>
    `;

    fetch(`https://fakestoreapi.com/products/category/${category}`)
        .then(res => res.json())
        .then(products => {
            productContainer.innerHTML = '';
            displayProducts(products);
        })
        .catch(err => {
            productContainer.innerHTML = '<p class="empty-cart">Failed to load products. Please try again later.</p>';
            console.error(err);
        });
}

function searchProducts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    if (!searchTerm.trim()) return;

    const productContainer = document.getElementById('product-container');
    productContainer.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Searching products...</p>
        </div>
    `;

    fetch("https://fakestoreapi.com/products")
        .then(res => res.json())
        .then(products => {
            const filteredProducts = products.filter(product => 
                product.title.toLowerCase().includes(searchTerm) || 
                product.description.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm)
            );
            
            productContainer.innerHTML = '';
            if (filteredProducts.length === 0) {
                productContainer.innerHTML = '<p class="empty-cart">No products found matching your search.</p>';
            } else {
                displayProducts(filteredProducts);
            }
        })
        .catch(err => {
            productContainer.innerHTML = '<p class="empty-cart">Failed to search products. Please try again later.</p>';
            console.error(err);
        });
}

function openCheckoutModal() {
    if (cartItems.length === 0) {
        showNotification('Your cart is empty');
        return;
    }

    const checkoutItems = document.getElementById('checkout-items');
    checkoutItems.innerHTML = '';
    let total = 0;

    cartItems.forEach(item => {
        total += item.price * item.quantity;
        const itemElement = document.createElement('div');
        itemElement.className = 'checkout-item';
        itemElement.innerHTML = `
            <span>${item.title} (${item.quantity})</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        `;
        checkoutItems.appendChild(itemElement);
    });

    document.getElementById('order-total').textContent = `$${(total + 5.99).toFixed(2)}`;
    document.getElementById('checkout-modal').classList.add('active');
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').classList.remove('active');
}

function placeOrder(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    
    if (!name || !email || !address) {
        showNotification('Please fill in all required fields');
        return;
    }

    const order = {
        name,
        email,
        address,
        items: cartItems,
        total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 5.99,
        date: new Date().toISOString()
    };

    console.log('Order placed:', order);
    
    cartItems = [];
    updateCartCount();
    updateCartUI();
    closeCheckoutModal();
    document.getElementById('checkout-form').reset();
    
    showNotification('Order placed successfully!');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('active');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}