const form=document.querySelector("#search-form"),input=document.querySelector("#search"),dateNode=document.querySelector("#date");
function updateDate(){dateNode.textContent=new Intl.DateTimeFormat("pt-PT",{weekday:"short",day:"numeric",month:"short"}).format(new Date())}
form.addEventListener("submit",e=>{e.preventDefault();const q=input.value.trim();if(!q)return input.focus();location.href="https://www.google.com/search?q="+encodeURIComponent(q)});
updateDate();setInterval(updateDate,60000);