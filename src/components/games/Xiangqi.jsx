/**
 * CỜ TƯỚNG CHUẨN ĐỐI KHÁNG (POV FLIP)
 * Tự động lật góc nhìn bàn cờ: Dù cầm Đỏ hay Đen, quân của mình LUÔN nằm ở nửa dưới màn hình hướng thẳng vào mắt!
 */

import React from 'react';
import { XiangqiGame } from './XiangqiGame';

export function Xiangqi(props) {
  return <XiangqiGame {...props} />;
}

export default Xiangqi;
