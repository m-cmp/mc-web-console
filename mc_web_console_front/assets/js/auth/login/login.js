import axios from 'axios';

document.getElementById("loginbtn").addEventListener('click',function () {
    let csrfToken = document.getElementById("csrf-token").getAttribute('content');
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;

    const userData = {
        id: document.getElementById("id").value,
        password: document.getElementById("password").value
    };

    axios.post('./', JSON.stringify(userData), {
        headers: {
            'Content-Type': 'application/json',
        }
    }) .then(function (response) {
        // 요청이 성공적으로 처리되었을 때 실행되는 코드
        if (response.status === 302) {
          // 리다이렉션 상태 코드를 확인하는 코드
          console.log('리다이렉션 발생');
        } else {
          // 리다이렉션이 아닌 다른 상태 코드일 때 처리하는 코드
          console.log('응답 상태 코드:', response.status);
        }
      })
      .catch(function (error) {
        // 요청이 실패했거나 응답이 오지 않은 경우 실행되는 코드
        console.error('요청 실패:', error);
      });
});