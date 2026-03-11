// 비밀번호 변경 모달 관련 로직

window.changeMyPassword = async function() {
    const currentPassword = document.getElementById('change-password-current').value;
    const newPassword = document.getElementById('change-password-new').value;
    const confirmPassword = document.getElementById('change-password-confirm').value;

    if (!currentPassword || currentPassword.trim() === '') {
        alert('Please enter your current password.');
        return;
    }

    if (!newPassword || newPassword.trim() === '') {
        alert('Please enter a new password.');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    try {
        const controller = "/api/mc-iam-manager/ChangeMyPassword";
        const data = {
            request: { currentPassword, newPassword }
        };
        const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);

        if (response && (response.status === 200 || response.data?.success)) {
            alert('Password changed successfully.');
            const modal = bootstrap.Modal.getInstance(document.getElementById('change-password-modal'));
            if (modal) modal.hide();
            document.getElementById('change-password-form').reset();
        } else if (response && response.status === 401) {
            alert('Current password is incorrect.');
        } else {
            alert('Failed to change password: ' + (response?.data?.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error changing password:', error);
        if (error.response && error.response.status === 401) {
            alert('Current password is incorrect.');
        } else {
            alert('Error changing password: ' + error.message);
        }
    }
};
