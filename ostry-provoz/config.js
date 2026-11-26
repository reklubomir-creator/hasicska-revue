const APP_VERSION="1.1.0-beta.21";
const PUSH_VAPID_PUBLIC_KEY=""; // Veřejný klíč testovacího doručování
const TEST_API_URL=""; // URL samostatného testovacího nasazení Apps Scriptu
const PRODUCTION_API_URL="https://script.google.com/macros/s/AKfycbwuEk9g6WroMHecImGviCG8aMujLvdxbDsrnTNrPzB7HBEgGfLBP-Vz3kOXsDHU8ZVjrw/exec";
function revueApiUrl(value=TEST_API_URL){
 const url=new URL(value||location.href);
 if(!value||url.protocol!=="https:"||url.hostname!=="script.google.com"||
    !/^\/macros\/s\/[\w-]+\/exec$/.test(url.pathname)||
    url.origin+url.pathname===PRODUCTION_API_URL){
  throw new Error("Pro vývojovou verzi nastav samostatné testovací nasazení Apps Scriptu.");
 }
 return url.origin+url.pathname;
}
