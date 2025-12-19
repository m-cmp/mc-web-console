import axios from 'axios';

// 활성 프로그레스 toast 추적 / Track active progress toasts
const activeProgressToasts = new Map();

/**
 * API 호출 시작 시 개별 progress toast 표시
 * Show individual progress toast when API call starts
 * 
 * @param {string} url - API URL
 * @param {string} label - 사용자에게 표시할 레이블 / Label to display to user
 * @returns {string} toastId - 생성된 toast의 ID / Created toast ID
 */
function showAPIProgressToast(url, label) {
  const toastId = `api-progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  if (webconsolejs && webconsolejs['common/utils/toast'] && 
      webconsolejs['common/utils/toast'].showProgressToast) {
    webconsolejs['common/utils/toast'].showProgressToast(
      toastId,
      label || 'Loading...'
    );
    
    activeProgressToasts.set(toastId, {
      url,
      label,
      startTime: Date.now()
    });
  }
  
  return toastId;
}

/**
 * API 완료 시 progress toast 제거
 * Hide progress toast when API completes
 * 
 * @param {string} toastId - 제거할 toast ID / Toast ID to remove
 * @param {boolean} success - 성공 여부 / Success status
 * @param {string} message - 완료 메시지 (선택) / Completion message (optional)
 */
function hideAPIProgressToast(toastId, success = true, message) {
  if (toastId && activeProgressToasts.has(toastId)) {
    if (webconsolejs && webconsolejs['common/utils/toast']) {
      // Progress toast 제거 / Remove progress toast
      if (webconsolejs['common/utils/toast'].hideToast) {
        webconsolejs['common/utils/toast'].hideToast(toastId);
      }
      
      // 성공/실패 toast 표시 (선택사항) / Show success/failure toast (optional)
      if (message && webconsolejs['common/util'] && webconsolejs['common/util'].showToast) {
        webconsolejs['common/util'].showToast(
          message,
          success ? 'success' : 'error',
          success ? 2000 : 5000
        );
      }
    }
    
    activeProgressToasts.delete(toastId);
  }
}

export async function commonAPIPost(url, data, attempt, options = {}) {
  // Loader Type 결정 / Determine loader type
  // options.loaderType: 'page' | 'toast' | 'none'
  const loaderType = options.loaderType || 'page'; // 기본값: page
  let toastId = null;
  
  // Loader 시작 / Start loader
  if (loaderType === 'toast') {
    toastId = showAPIProgressToast(url, options.progressLabel);
  } else if (loaderType === 'page') {
    activePageLoader();
  }
  // loaderType === 'none'이면 로더 표시 안 함 / No loader if 'none'
  
  if (attempt === undefined) {
    attempt = false;
  }
  
  console.log("#### commonAPIPost");
  console.log("Request URL :", url);
  console.log("Request Data :", JSON.stringify(data));
  console.log("Loader Type :", loaderType);
  console.log("-----------------------");
  
  try {
    if (data === undefined || data === null) {
      var response = await axios.post(url);
    } else if (data.formData instanceof FormData) {
      // FormData 처리 분기 - axios 사용
      console.log("FormData detected, sending with axios");
      
      // pathParams가 있으면 FormData에 추가
      if (data.pathParams) {
        for (const [key, value] of Object.entries(data.pathParams)) {
          data.formData.append(key, value);
        }
        console.log("Added pathParams to FormData:", data.pathParams);
      }
      
      // queryParams가 있으면 FormData에 추가
      if (data.queryParams) {
        for (const [key, value] of Object.entries(data.queryParams)) {
          data.formData.append(key, value);
        }
        console.log("Added queryParams to FormData:", data.queryParams);
      }
      
      // FormData 사용 시 Content-Type 헤더를 설정하지 않음
      // 브라우저가 자동으로 boundary 정보와 함께 올바른 헤더를 설정
      var response = await axios.post(url, data.formData);
    } else {
      var response = await axios.post(url, data);
    }
    
    console.log("#### commonAPIPost Response");
    console.log("Response status : ", response.status);
    console.log("Response from : ", url, response.data);
    console.log("----------------------------");
    
    // Loader 종료 / End loader
    if (loaderType === 'toast' && toastId) {
      hideAPIProgressToast(toastId, true, options.successMessage);
    } else if (loaderType === 'page') {
      deactivePageLoader();
    }
    
    return response;
  } catch (error) {
    console.log("#### commonAPIPost Error");
    console.log("Error from : ", url, error.response ? error.response.status : error.message);
    console.log("----------------------------");
    
    if (!attempt || attempt === undefined) {
      if (error.response && error.response.status === 429) {
        webconsolejs["common/util"].showToast("Too many requests. Please try again later.", 'warning');
        // Loader 종료 / End loader
        if (loaderType === 'toast' && toastId) {
          hideAPIProgressToast(toastId, false);
        } else if (loaderType === 'page') {
          deactivePageLoader();
        }
        return error;
      }
      // 404 에러는 데이터가 없는 정상적인 상황이므로 토큰 갱신하지 않음
      if (error.response && error.response.status === 404) {
        console.log("Resource not found (404) - this may be normal for empty data");
        // Loader 종료 / End loader
        if (loaderType === 'toast' && toastId) {
          hideAPIProgressToast(toastId, false);
        } else if (loaderType === 'page') {
          deactivePageLoader();
        }
        return error;
      }
      // 401 Unauthorized는 토큰 만료 또는 인증 실패
      if (error.response && error.response.status === 401) {
        const authrefreshStatus = await webconsolejs["common/cookie/authcookie"].refreshCookieAccessToken();
        if (authrefreshStatus) {
          console.log("refreshCookieAccessToken success. Retrying request with refreshed token...");
          return commonAPIPost(url, data, true, options);
        } else {
          // Loader 종료 / End loader
          if (loaderType === 'toast' && toastId) {
            hideAPIProgressToast(toastId, false);
          } else if (loaderType === 'page') {
            deactivePageLoader();
          }
          webconsolejs["common/util"].showToast("Session has expired. Please login again.", 'error');
          window.location = "/auth/login";
          return;
        }
      }
      // 403 Forbidden은 권한 부족
      if (error.response && error.response.status === 403) {
        // Loader 종료 / End loader
        if (loaderType === 'toast' && toastId) {
          hideAPIProgressToast(toastId, false);
        } else if (loaderType === 'page') {
          deactivePageLoader();
        }
        webconsolejs["common/util"].showToast("Insufficient permissions. Please contact your administrator.", 'error');
        return error;
      }
      // 500 Internal Server Error는 서버 오류
      if (error.response && error.response.status === 500) {
        // Loader 종료 / End loader
        if (loaderType === 'toast' && toastId) {
          hideAPIProgressToast(toastId, false);
        } else if (loaderType === 'page') {
          deactivePageLoader();
        }
        webconsolejs["common/util"].showToast("Server error occurred. Please try again later.", 'error');
        return error;
      }
      // 기타 HTTP 에러
      if (error.response && (error.response.status !== 200)) {
        const authrefreshStatus = await webconsolejs["common/cookie/authcookie"].refreshCookieAccessToken();
        if (authrefreshStatus) {
          console.log("refreshCookieAccessToken success. Retrying request with refreshed token...");
          return commonAPIPost(url, data, true, options);
        } else {
          // Loader 종료 / End loader
          if (loaderType === 'toast' && toastId) {
            hideAPIProgressToast(toastId, false);
          } else if (loaderType === 'page') {
            deactivePageLoader();
          }
          // 토큰 갱신 실패 시 에러 메시지만 표시하고 로그인 페이지로 리다이렉트하지 않음
          webconsolejs["common/util"].showToast("An error occurred. Please try again later.", 'error');
          return error;
        }
      }
    }
    
    // Loader 종료 / End loader
    if (loaderType === 'toast' && toastId) {
      hideAPIProgressToast(toastId, false);
    } else if (loaderType === 'page') {
      deactivePageLoader();
    }
    
    // 네트워크 오류나 기타 예외 상황 처리
    if (!error.response) {
      // 네트워크 오류 (서버에 연결할 수 없음)
      if (error.code === 'ECONNABORTED') {
        webconsolejs["common/util"].showToast("Request timeout. Please check your network connection and try again.", 'error');
      } else if (error.code === 'ERR_NETWORK') {
        webconsolejs["common/util"].showToast("Network connection failed. Please check your internet connection and try again.", 'error');
      } else {
        webconsolejs["common/util"].showToast("An error occurred while processing the request: " + error.message, 'error');
      }
    } else {
      // HTTP 에러가 있지만 위에서 처리되지 않은 경우
      if (error.response.status) {
        webconsolejs["common/util"].showToast("An error occurred while processing the request. (Status code: " + error.response.status + ")", 'error');
      } else {
        webconsolejs["common/util"].showToast("An error occurred while processing the request: " + error.message, 'error');
      }
    }
    
    return error;
  }
}

export async function commonAPIPostWithoutRetry(url, data) {   
    try {
        let response;
        if (data === undefined) {
            response = await axios.post(url);
        } else {
            response = await axios.post(url, data);
        }
        console.log("#### commonAPIPostWithoutRetry Response");
        console.log("Response status : ", response.status);
        console.log("Response from : ",url, response.data);
        console.log("----------------------------");
        return response;
    } catch (error) {
        console.log("#### commonAPIPostWithoutRetry Error");
        console.log("Error status:", error.response ? error.response.status : "No response");
        console.log("Error message:", error.message);
        console.log("Error response data:", error.response ? error.response.data : "No response data");
        if (error.response && error.response.data) {
            if (typeof error.response.data === 'object') {
                console.log("Error response data keys:", Object.keys(error.response.data));
            }
        }
        console.log("----------------------------");
        console.log("Request failed :", error);
        
        // 에러 메시지 표시 (retry 없이)
        if (error.response) {
            if (error.response.status === 401) {
                webconsolejs["common/util"].showToast("Authentication required. Please login again.", 'error');
            } else if (error.response.status === 403) {
                webconsolejs["common/util"].showToast("Insufficient permissions. Please contact your administrator.", 'error');
            } else if (error.response.status === 404) {
                console.log("Requested resource not found.");
            } else if (error.response.status === 500) {
                webconsolejs["common/util"].showToast("Server error occurred. Please try again later.", 'error');
            } else {
                webconsolejs["common/util"].showToast("An error occurred while processing the request. (Status code: " + error.response.status + ")", 'error');
            }
        } else {
            // 네트워크 오류
            if (error.code === 'ECONNABORTED') {
                webconsolejs["common/util"].showToast("Request timeout. Please check your network connection and try again.", 'error');
            } else if (error.code === 'ERR_NETWORK') {
                webconsolejs["common/util"].showToast("Network connection failed. Please check your internet connection and try again.", 'error');
            } else {
                webconsolejs["common/util"].showToast("An error occurred while processing the request: " + error.message, 'error');
            }
        }
        
        return error;
    }
}

function activePageLoader(){
    try{
        document.getElementById("pageloader").classList.add('active');
    }catch(error){
        console.log("pageloader is not exist ")
    }
}

function deactivePageLoader(){
    try{
        document.getElementById("pageloader").classList.remove('active');
    }catch(error){
        console.log("pageloader is not exist ")
    }
}

export async function commonAPIGet(url) {
    console.log("#### commonAPIGet")
    console.log("Request URL : ", url)

    const response = await axios.get(url)
        .then(function (response) {
            console.log("#### commonAPIPost Response")
            console.log("Response status : ", (response.status))
            console.log("----------------------------")
            return response
        })
        .catch(function (error) {
            console.log("#### commonAPIPost Response ERR")
            console.log("error : ", (error))
            console.log("--------------------------------")
            return error
        });

    return response
}
 