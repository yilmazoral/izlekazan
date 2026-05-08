async function testApi(){
  const el = document.getElementById("result");
  try {
    const r = await fetch("/api/test");
    const j = await r.json();
    el.textContent = JSON.stringify(j, null, 2);
  } catch(e) {
    el.textContent = "API hatası: " + e.message;
  }
}
