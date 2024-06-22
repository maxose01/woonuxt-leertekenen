import type { CheckoutInput, UpdateCustomerInput, CreateAccountInput } from '#gql';
import {useContactStore} from "../../../../stores/useContactStore";
import {useFetch} from "#app";
import {useModalStore} from "../../../../stores/modalStore";

export function useCheckout() {
  const modalStore = useModalStore();

  const orderInput = useState<any>('orderInput', () => {
    return {
      customerNote: '',
      paymentMethod: '',
      shipToDifferentAddress: false,
      metaData: [{ key: 'order_via', value: 'WooNuxt' }],
    };
  });

  const isProcessingOrder = useState<boolean>('isProcessingOrder', () => false);

  // if Country or State are changed, calculate the shipping rates again
  async function updateShippingLocation() {
    const { customer, viewer } = useAuth();
    const { isUpdatingCart, refreshCart } = useCart();

    isUpdatingCart.value = true;

    try {
      const { updateCustomer } = await GqlUpdateCustomer({
        input: {
          id: viewer?.value?.id,
          shipping: orderInput.value.shipToDifferentAddress ? customer.value.shipping : customer.value.billing,
          billing: customer.value.billing,
        } as UpdateCustomerInput,
      });

      if (updateCustomer) refreshCart();
    } catch (error) {
      console.error(error);
    }
  }

  function openPayPalWindow(redirectUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const width = 750;
      const height = 750;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2 + 80;
      const payPalWindow = window.open(redirectUrl, '', `width=${width},height=${height},top=${top},left=${left}`);
      const timer = setInterval(() => {
        if (payPalWindow?.closed) {
          clearInterval(timer);
          resolve(true);
        }
      }, 500);
    });
  }

  const isPopupBlocked = () => {
    const testPopup = window.open('', '', 'width=100,height=100');
    if (!testPopup || testPopup.closed || typeof testPopup.closed === 'undefined') {
      return true; // Pop-ups zijn geblokkeerd
    } else {
      testPopup.close();
      return false; // Pop-ups zijn niet geblokkeerd
    }
  };


  // function openMollieWindow(redirectUrl: string): Promise<boolean> {
  //   // window.location.assign(redirectUrl);
  //   return new Promise((resolve) => {
  //       modalStore.openModal(redirectUrl);
  //       //resolve(true);
  //   });
  // }

  function openMollieWindow(redirectUrl: string): Promise<boolean> {
    var windowReference = window.open();
    modalStore.openModal(redirectUrl);
    // Detect Safari
    const is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
    const is_safari = navigator.userAgent.indexOf("Safari") > -1;

    return new Promise((resolve) => {
      const mollieWindow = window.open(redirectUrl, '_blank');

      // Als het venster niet kon worden geopend, gebruik dan een redirect als fallback
      if (!mollieWindow || mollieWindow.closed || typeof mollieWindow.closed === 'undefined') {
        if(is_chrome) window.location.href = redirectUrl;
        else if(is_safari) location.replace(redirectUrl);
        else location.href = redirectUrl;

        resolve(true); // Los de Promise op met de waarde true
      } else {
        // Stel een interval in om te controleren of het venster is gesloten
        const checkInterval = setInterval(() => {
          if (mollieWindow.closed) {
            clearInterval(checkInterval);
            resolve(true); // Los de Promise op met de waarde true
          }
        }, 500); // Controleer elke 500 milliseconden
      }
    });
  }



  const proccessCheckout = async (isPaid = false) => {
    const { loginUser } = useAuth();
    const router = useRouter();
    const { replaceQueryParam } = useHelpers();
    const { emptyCart, refreshCart } = useCart();
    const { customer } = useAuth();

    isProcessingOrder.value = true;

    const { username, password, shipToDifferentAddress } = orderInput.value;
    const billing = customer.value.billing;
    const shipping = shipToDifferentAddress ? customer.value.shipping : billing;

    try {
      let checkoutPayload: CheckoutInput = {
        billing,
        shipping,
        metaData: orderInput.value.metaData,
        paymentMethod: orderInput.value.paymentMethod.id,
        customerNote: orderInput.value.customerNote,
        shipToDifferentAddress,
        transactionId: orderInput.value.transactionId,
        isPaid,
      };

      console.log(checkoutPayload);

      const { checkout } = await GqlCheckout(checkoutPayload);

      // Login user if account was created during checkout
      if (orderInput.value.createAccount) {
        await loginUser({ username, password });
      }

      const orderId = checkout?.order?.databaseId;
      const orderKey = checkout?.order?.orderKey;
      const isPayPal = orderInput.value.paymentMethod.id === 'paypal';
      const isMollie = orderInput.value.paymentMethod.id.startsWith('mollie_');

      // PayPal redirect
      if ((await checkout?.redirect) && isPayPal) {
        const frontEndUrl = window.location.origin;
        let redirectUrl = checkout?.redirect ?? '';

        const payPalReturnUrl = `${frontEndUrl}/checkout/order-received/${orderId}/?key=${orderKey}&from_paypal=true`;
        const payPalCancelUrl = `${frontEndUrl}/checkout/?cancel_order=true&from_paypal=true`;

        redirectUrl = replaceQueryParam('return', payPalReturnUrl, redirectUrl);
        redirectUrl = replaceQueryParam('cancel_return', payPalCancelUrl, redirectUrl);
        redirectUrl = replaceQueryParam('bn', 'WooNuxt_Cart', redirectUrl);

        const isPayPalWindowClosed = await openPayPalWindow(redirectUrl);

        if (isPayPalWindowClosed) {
          router.push(`/checkout/order-received/${orderId}/?key=${orderKey}&fetch_delay=true`);
        }
      }
      else if ((await checkout?.redirect) && isMollie) {
        let redirectUrl = checkout?.redirect ?? '';
        console.log("redirectUrl = ", redirectUrl);
        const isMollieWindowClosed = await openMollieWindow(redirectUrl);
        //alert(isMollieWindowClosed);
        if (isMollieWindowClosed) {
          router.push(`/checkout/order-received/${orderId}/?key=${orderKey}&fetch_delay=true`);
        }
      }
      else {
        router.push(`/checkout/order-received/${orderId}/?key=${orderKey}`);
      }

      if ((await checkout?.result) !== 'success') {
        alert('There was an error processing your order. Please try again.');
        window.location.reload();
        return checkout;
      } else {
        await emptyCart();
        await refreshCart();
      }
    } catch (error: any) {
      // alert(error.message);
      // isProcessingOrder.value = false;
      // return null;
    }

    isProcessingOrder.value = false;
  };

  return {
    orderInput,
    isProcessingOrder,
    proccessCheckout,
    updateShippingLocation,
  };
}
