// the below code is included on every page and grabs the current cart from local storage if it exists
// if not, it creates the base user cart data. Additionally the last line inserts the current quantity
// of items into the webpage next to the cart icon. I felt this was an easy and useful QoL thing
// that visually shows when items are being added to the cart without having to check the cart page.
if (!localStorage.getItem("user_cart_data")) {
    let userCartData = {"total_quantity": 0, "cart": []};
    localStorage.setItem("user_cart_data", JSON.stringify(userCartData));
}

var userCartData = JSON.parse(localStorage.getItem("user_cart_data"));
document.getElementById("quantity").innerHTML = userCartData["total_quantity"];

// everytime a new page is loaded I'm fetching the client ip using a third party api and
// storing it in a cookie. This ip is being leveraged as the visitor_id field to keep track of 
// users through sessions and page changes. This is obviously not ideal but I figured it was a quick 
// and easy approach for this assignment. To optimize this I could check if the user already has
// a valid cookie and skip the request.
async function getUserIp() {
    let response = await fetch('https://api.ipify.org?format=json');
    let data = await response.json();
    return data.ip;
}

getUserIp()
    .then(ip => document.cookie = "blackcrowuser="+ip+"; expires=Sat, 1 Jan 2022 12:00:00 UTC; path=/")
    .then(() => {apiView(userCartData["cart"])});


// interface with blackcrow sandbox api
function apiView(cart) {
    var data = {
        "site_name": "BLACKCROW",
        "page_id": document.title == "CrowMart" ? "home" : "other",
        "site_country": "US",
        "site_language": "en",
        "site_currency": "USD",
        "page_title": document.title,
        "page_url": window.location.href,
        "visitor_id": getVisitorId(),
        "cart": cart,
      }
    
      fetch('https://api.sandbox.blackcrow.ai/v1/events/view', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-type': 'application/json'
        }
      });
}


// helper functions used on most pages

// adds or updates data in the cart array within the userCartData object then calls updateCart 
// to persist the updates in local storage 
function addToCart(id, price) {
    let cart = userCartData["cart"];

    let found = false;
    for (const [index, item] of cart.entries()) {
        if (item["id"] == id) {
            cart[index]["quantity"] = cart[index]["quantity"] + 1;
            found = true;
        }
    }

    if (!found) {
        cart.push({"id": id, "price": price, "quantity": 1});
    }
    
    userCartData["cart"] = cart;
    updateCart();
}

// runs apiView to send view event when the cart is updated, additionally updates the quantity of
// items in the cart on the frontend
function updateCart() {
    let cart = userCartData["cart"];
    
    apiView(cart);

    let cartKeys = Object.keys(cart);
    let totalQuantity = 0;
    for (itemName of cartKeys) {
        totalQuantity += cart[itemName]["quantity"];
    }
    userCartData["total_quantity"] = totalQuantity;

    localStorage.setItem("user_cart_data", JSON.stringify(userCartData));
    document.getElementById("quantity").innerHTML = totalQuantity;
}

// this function to read a cookie by name I found at https://www.geeksforgeeks.org/how-to-create-and-read-value-from-cookie/
// I modified the function to only return the user cookie I am specifically setting to store the
// user's ip address, which will stand in for the visitor_id field required by /v1/events/view
function getVisitorId() {
    var name = "blackcrowuser=";
    var decoded_cookie = decodeURIComponent(document.cookie);
    var carr = decoded_cookie.split(';');
    for(var i=0; i<carr.length;i++){
    var c = carr[i];
    while(c.charAt(0)==' '){
        c=c.substring(1);
    }
    if(c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
    }
     }
     return "";
}
