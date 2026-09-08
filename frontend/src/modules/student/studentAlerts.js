import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

/**
 * Custom-themed SweetAlert2 instance for the RLabZ Student Portal
 * Scoped to match the Student Portal emerald / slate aesthetic.
 */
export const StudentSwal = Swal.mixin({
  confirmButtonColor: '#059669',
  cancelButtonColor: '#94a3b8',
  buttonsStyling: true,
  customClass: {
    popup: 'student-swal-modal',
    confirmButton: 'student-swal-confirm-btn',
    cancelButton: 'student-swal-cancel-btn',
    title: 'student-swal-title',
    htmlContainer: 'student-swal-html'
  }
});

/**
 * Quick helper for success alerts
 */
export function showStudentSuccess(title, text, timer = null) {
  return StudentSwal.fire({
    icon: 'success',
    title,
    text,
    ...(timer ? { timer, timerProgressBar: true, showConfirmButton: false } : { confirmButtonText: 'Great!' })
  });
}

/**
 * Quick helper for error alerts
 */
export function showStudentError(title, text) {
  return StudentSwal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'OK'
  });
}

/**
 * Quick helper for warning alerts
 */
export function showStudentWarning(title, text, confirmButtonText = 'Understood') {
  return StudentSwal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonText
  });
}

/**
 * Quick helper for confirmation dialogs
 */
export function showStudentConfirm(title, text, confirmButtonText = 'Yes, Proceed', cancelButtonText = 'Cancel') {
  return StudentSwal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText
  });
}

export default StudentSwal;
