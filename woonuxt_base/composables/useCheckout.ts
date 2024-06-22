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

  function isSmartphone() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    return /android|bb\d+|meego.+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(userAgent) ||
        /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0,4));
  }

  function openMollieWindow(redirectUrl: string): Promise<boolean> {
    var windowReference = window.open();
    modalStore.openModal(redirectUrl);
    // Detect Safari
    const is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
    const is_safari = navigator.userAgent.indexOf("Safari") > -1;

    return new Promise((resolve) => {
      if(isSmartphone())
      {
        window.location.href = redirectUrl;

        const checkInterval = setInterval(() => {
          resolve(true); // Los de Promise op met de waarde true
        }, 500);
      }
      else
      {
        const mollieWindow = window.open(redirectUrl, '_blank');

        // Als het venster niet kon worden geopend, gebruik dan een redirect als fallback
        if (!mollieWindow || mollieWindow.closed || typeof mollieWindow.closed === 'undefined') {
          window.location.href = redirectUrl;

          const checkInterval = setInterval(() => {
            resolve(true); // Los de Promise op met de waarde true
          }, 500);
        } else {
          // Stel een interval in om te controleren of het venster is gesloten
          const checkInterval = setInterval(() => {
            if (mollieWindow.closed) {
              clearInterval(checkInterval);
              resolve(true); // Los de Promise op met de waarde true
            }
          }, 500);
        }
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
      isProcessingOrder.value = false;
      return null;
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
