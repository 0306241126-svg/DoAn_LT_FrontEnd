import { useState } from 'react';
import { LockKeyhole, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import Input from '../common/Input';

// Modal bảo vệ vùng riêng tư, hỗ trợ mở khóa và thiết lập mật khẩu mới.
function PrivateLockModal({ isOpen, onSubmit, mode = 'unlock' }) {
  // useNavigate nối nút X với route trang chủ của ứng dụng.
  const navigate = useNavigate();
  // State controlled lưu mật khẩu, lỗi validation và trạng thái gửi form.
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Chỉ mode setup mới áp dụng quy tắc mật khẩu mới dài hơn 6 ký tự.
  const isSetup = mode === 'setup';

  if (!isOpen) return null;

  // Kiểm tra mật khẩu trước khi gọi callback xử lý API ở component cha.
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSetup && password.length <= 6) {
      setPasswordError('Mật khẩu mới phải dài hơn 6 ký tự.');
      return;
    }
    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu.');
      return;
    }

    setPasswordError('');
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await onSubmit(password);
    } catch (error) {
      setSubmitError(error?.message || 'Không thể xác thực mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="private-lock-title" className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        {/* Nút X điều hướng về trang chủ theo yêu cầu vùng riêng tư. */}
        <button type="button" aria-label="Thoát vùng riêng tư" title="Thoát về trang chủ" onClick={() => navigate('/')} className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-muted">
          <X size={20} aria-hidden="true" />
        </button>
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-(--color-primary)/10 text-(--color-primary)">
            <LockKeyhole size={24} aria-hidden="true" />
          </span>
          <h2 id="private-lock-title" className="text-xl font-bold">{isSetup ? 'Thiết lập vùng riêng tư' : 'Mở khóa vùng riêng tư'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{isSetup ? 'Tạo mật khẩu mới để bảo vệ ghi chú.' : 'Nhập mật khẩu để tiếp tục.'}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input dùng chung nhận mật khẩu và hiển thị lỗi validation màu đỏ. */}
          <Input
            label={isSetup ? 'Mật khẩu mới' : 'Mật khẩu'}
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (event.target.value.length > 6 || (!isSetup && event.target.value)) setPasswordError('');
            }}
            error={passwordError}
            autoFocus
            placeholder="Nhập mật khẩu"
          />
          {submitError && <p className="text-sm text-red-600" role="alert">{submitError}</p>}
          {/* Button dùng chung gọi handleSubmit và hiển thị loading khi chờ API. */}
          <Button type="submit" loading={isSubmitting} className="w-full">{isSetup ? 'Tạo mật khẩu' : 'Mở khóa'}</Button>
        </form>
      </div>
    </div>
  );
}

export default PrivateLockModal;