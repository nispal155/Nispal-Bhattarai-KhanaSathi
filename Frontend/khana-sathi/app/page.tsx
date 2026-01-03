import Signup from './(Auth)/Signup/page';
import Login from './(Auth)/login/page';
// import R_Dash from './rider-dashboard/page';
import Checkout from './(Payment-Process)/checkout/page';
import Payement from './(Payment-Process)/payment/page';

export default function Page() {
  return (
    <div>
      <Signup />
      <Login />
      {/* // <R_Dash /> */}
      <Checkout />
      <Payement />
    </div>
  );
}
