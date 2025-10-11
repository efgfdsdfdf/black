
/* auth.js - lightweight auth helpers to wire up login/signup/logout across pages
   - Looks for forms with id 'login-form' or 'signup-form' and captures username to localStorage.loggedInUser
   - Finds elements with classes: .nav-profile, .nav-gpa, .nav-logout and wires navigation
   - Shows greeting placeholders with class .user-greet
*/

(function(){
  function getValue(el, selector){ return el ? (el.querySelector(selector) ? el.querySelector(selector).value : "") : ""; }

  function bindForms(){
    const login = document.getElementById("login-form");
    if(login){
      login.addEventListener("submit", function(e){
        e.preventDefault();
        // try common field names
        const uname = login.querySelector('input[name="username"]')?.value || login.querySelector('input[type="text"]')?.value || login.querySelector('input[name="email"]')?.value || "";
        if(!uname) return alert("Please enter username");
        // emulate saving user record (if the project uses 'user_'+username elsewhere, preserve that too)
        try { localStorage.setItem("loggedInUser", uname); } catch(e){}
        // Also set a simple marker for older code that checks 'user_'+username
        try { localStorage.setItem("user_" + uname, JSON.stringify({username: uname})); } catch(e){}
        // Redirect to homepage or index
        const dest = login.getAttribute("data-redirect") || "index.html" ;
        window.location.href = dest;
      });
    }

    const signup = document.getElementById("signup-form");
    if(signup){
      signup.addEventListener("submit", function(e){
        e.preventDefault();
        const uname = signup.querySelector('input[name="username"]')?.value || signup.querySelector('input[type="text"]')?.value || "";
        const pwd = signup.querySelector('input[name="password"]')?.value || "";
        if(!uname || !pwd) return alert("Please provide username and password");
        // store minimal record
        try { localStorage.setItem("user_" + uname, JSON.stringify({username: uname, password: pwd})); } catch(e){}
        try { localStorage.setItem("loggedInUser", uname); } catch(e){}
        const dest = signup.getAttribute("data-redirect") || "index.html";
        window.location.href = dest;
      });
    }
  }

  function bindNavButtons(){
    // profile, gpa, timetable, logout buttons (by class)
    document.querySelectorAll(".nav-profile").forEach(el=> el.addEventListener("click", ()=> window.location.href = "profile.html"));
    document.querySelectorAll(".nav-gpa").forEach(el=> el.addEventListener("click", ()=> window.location.href = "gpa.html"));
    document.querySelectorAll(".nav-notes").forEach(el=> el.addEventListener("click", ()=> window.location.href = "notes.html"));
    document.querySelectorAll(".nav-timetable").forEach(el=> el.addEventListener("click", ()=> window.location.href = "timetable.html"));
    document.querySelectorAll(".nav-home").forEach(el=> el.addEventListener("click", ()=> window.location.href = "index.html"));
    document.querySelectorAll(".nav-logout").forEach(el=> el.addEventListener("click", ()=> {
      try { localStorage.removeItem("loggedInUser"); } catch(e) {}
      // do not remove user_... records to preserve signup history
      window.location.href = "login.html";
    }));
  }

  function showGreetings(){
    const user = localStorage.getItem("loggedInUser") || "";
    document.querySelectorAll(".user-greet").forEach(el=> {
      if(user) el.textContent = "Hi, " + user;
      else el.textContent = "Hi, Guest";
    });
    // Update any element with id 'username-display'
    const d = document.getElementById("username-display");
    if(d) d.textContent = user || "Guest";
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", ()=>{ bindForms(); bindNavButtons(); showGreetings(); });
  } else {
    bindForms(); bindNavButtons(); showGreetings();
  }
})();
