/**
 * KIỂM THỬ MODULE MÃ HÓA (backend/tests/test_encryption.js)
 */

const { hashPassword, comparePassword } = require('../src/utils/encryption');

async function runEncryptionTests() {
  console.log('====== BẮT ĐẦU KIỂM THỬ MODULE MÃ HÓA (ENCRYPTION) ======\n');

  const testPassword = 'MySecretPassword123@';
  const wrongPassword = 'WrongPassword456!';

  try {
    // 1. Kiểm tra tính năng băm mật khẩu (hashPassword)
    console.log(`1. Đang băm mật khẩu thử nghiệm: "${testPassword}"...`);
    const hashedPassword = await hashPassword(testPassword);
    
    console.log(`- Chuỗi hash sinh ra: ${hashedPassword}`);

    // Khai báo biến kiểm tra định dạng Bcrypt (bắt đầu bằng $2a$, $2b$ hoặc $2y$)
    const isValidHashFormat = typeof hashedPassword === 'string' && hashedPassword.startsWith('$2');
    
    if (isValidHashFormat) {
      console.log('=> KẾT QUẢ hashPassword: ĐẠT CHUẨN ✅ (Chuỗi băm chuẩn Bcrypt)\n');
    } else {
      console.error('=> KẾT QUẢ hashPassword: THẤT BẠI ❌ (Định dạng hash không hợp lệ)\n');
    }

    // 2. Kiểm tra so khớp với mật khẩu ĐÚNG
    console.log('2. Kiểm tra so khớp với mật khẩu ĐÚNG:');
    const isMatchCorrect = await comparePassword(testPassword, hashedPassword);
    console.log(`- Kết quả comparePassword: ${isMatchCorrect}`);

    if (isMatchCorrect === true) {
      console.log('=> KẾT QUẢ mật khẩu đúng: ĐẠT CHUẨN ✅\n');
    } else {
      console.error('=> KẾT QUẢ mật khẩu đúng: THẤT BẠI ❌\n');
    }

    // 3. Kiểm tra so khớp với mật khẩu SAI
    console.log(`3. Kiểm tra so khớp với mật khẩu SAI ("${wrongPassword}"):`);
    const isMatchWrong = await comparePassword(wrongPassword, hashedPassword);
    console.log(`- Kết quả comparePassword: ${isMatchWrong}`);

    if (isMatchWrong === false) {
      console.log('=> KẾT QUẢ mật khẩu sai: ĐẠT CHUẨN ✅\n');
    } else {
      console.error('=> KẾT QUẢ mật khẩu sai: THẤT BẠI ❌\n');
    }

  } catch (error) {
    console.error('=> PHÁT SINH LỖI TRONG QUÁ TRÌNH KIỂM THỬ ❌:', error);
  }

  console.log('====== KẾT THÚC KIỂM THỬ ENCRYPTION ======');
}

runEncryptionTests();