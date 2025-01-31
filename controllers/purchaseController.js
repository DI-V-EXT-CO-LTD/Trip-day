const Purchase = require("../models/purchase");
const Cart = require("../models/cart");
const Hotel = require("../models/hotel");
const Message = require("../models/message");
const User = require("../models/user");
const mailgunConfig = require("../config/mailgun");
const mailgun = require("mailgun-js")(mailgunConfig);
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { client: paypalClient, paypal } = require("../config/paypal");
const omise = require("../config/omise");
const Paymentwall = require("../config/paymentwall");
const EmailLog = require("../models/emailLog");
const crypto = require("crypto");
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.TELGRAM_BOT_TOKEN, { polling: false });
const { PaymentMethod } = require("../models/paymentMethod");

console.log("Payment providers initialized");

exports.createPaymentIntent = async (req, res) => {
  console.log("Request received for creating PaymentIntent:", req.body);
  try {
    const { paymentMethod } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: "items.room",
        model: "Room",
      })
      .populate({
        path: "items.hotel",
        model: "Hotel",
      });

    if (!cart || cart.items.length === 0) {
      console.log("Cart is empty");
      return res.status(400).json({ error: "Cart is empty" });
    }

    const selectedItems = cart.items.filter((item) => item.isSelected);

    if (selectedItems.length === 0) {
      console.log("No items selected for purchase");
      return res.status(400).json({ error: "No items selected for purchase" });
    }

    const amount = selectedItems.reduce((total, item) => {
      if (item.ProductType === "Package") {
        return total + item.price * item.quantity * item.nights;
      }
      return total + item.price * item.quantity;
    }, 0);

    const currency = "thb";

    console.log("Creating payment intent with:", {
      amount,
      currency,
      paymentMethod,
    });

    switch (paymentMethod) {
      case "stripe":
        try {
          const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100,
            currency: "thb",
          });

          if (!paymentIntent.client_secret) {
            console.log("Client secret was not generated:", paymentIntent);
            return res
              .status(500)
              .json({ error: "Failed to generate client secret" });
          }

          console.log("Stripe payment intent created:", paymentIntent);
          console.log(`Stripe PaymentIntent 생성 완료: ${paymentIntent}`);
          res.status(200).json({ clientSecret: paymentIntent.client_secret });
        } catch (error) {
          console.error("Failed to create Stripe PaymentIntent:", error);
          res.status(500).json({
            error: "Failed to create PaymentIntent",
            details: error.message,
          });
        }
        break;

      case "paypal":
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: currency.toUpperCase(),
                value: (amount / 100).toFixed(2),
              },
            },
          ],
        });
        try {
          const order = await paypalClient.execute(request);
          console.log("PayPal order created:", order);
          res.status(200).json({ orderId: order.result.id });
        } catch (error) {
          console.error("Failed to create PayPal order:", error);
          res.status(500).json({
            error: "Failed to create PayPal order",
            details: error.message,
          });
        }
        break;

      case "omise":
        try {
          const charge = await omise.charges.create({
            amount: amount,
            currency: currency,
            capture: true,
            return_uri: "https://www.trip-day.com",
          });
          console.log("Omise charge created:", charge);
          res.status(200).json({ authorizeUri: charge.authorize_uri });
        } catch (error) {
          console.error("Failed to create Omise charge:", error);
          res.status(500).json({
            error: "Failed to create Omise charge",
            details: error.message,
          });
        }
        break;

      case "paymentwall":
        try {
          console.log(
            "PAYMENT WALL PROJECT KEY: ",
            process.env.PAYMENTWALL_PROJECT_KEY
          );
          const widget = new Paymentwall.Widget(
            userId, // 여기서 userId를 uid로 전달
            process.env.PAYMENTWALL_PROJECT_KEY,
            [
              {
                id: "trip_day_booking",
                amount: amount,
                currency_code: currency.toUpperCase(),
                name: "Trip Day Booking",
                product_type: "fixed",
              },
            ],
            {
              email: user.email,
              success_url: `https://www.trip-day.com/payment/success`,
              failure_url: `https://www.trip-day.com/payment/failure`,
            }
          );

          const widgetUrl = widget.getUrl();
          console.log("Paymentwall widget created:", widgetUrl);

          res.status(200).json({
            paymentUrl: widgetUrl,
          });
        } catch (error) {
          console.error("Failed to create Paymentwall widget:", error);
          res.status(500).json({
            error: "Failed to create Paymentwall widget",
            details: error.message,
          });
        }
        break;

      case "bank_transfer":
        try {
          const purchase = await createPurchaseFromPayment(
            { id: "bank_transfer" },
            "bank_transfer",
            "pending",
            req.user
          );
          console.log("Purchase created for bank transfer:", purchase);

          res.status(200).json({
            type: "Bank Transfer",
            accountNumber: "1234-5678-9012-3456",
            total: amount,
            purchase: purchase,
          });

          // await sendReceiptEmail(req.user.email, purchase);
        } catch (error) {
          console.error("Error processing bank transfer:", error);
          res.status(500).json({
            error: "Failed to process bank transfer",
            details: error.message,
          });
        }
        break;

      case "crypto":
        try {
          const purchase = await createPurchaseFromPayment(
            { id: "crypto" },
            "crypto",
            "pending",
            req.user
          );
          console.log("Purchase created for crypto payment:", purchase);

          res.status(200).json({
            type: "Cryptocurrency",
            walletAddress: "0x1234567890123456789012345678901234567890",
            usdtRate: 35,
            usdtAmount: (amount / 100 / 35).toFixed(2),
            total: amount / 100,
            purchase: purchase,
          });

          // await sendReceiptEmail(req.user.email, purchase);
        } catch (error) {
          console.error("Error processing crypto payment:", error);
          res.status(500).json({
            error: "Failed to process crypto payment",
            details: error.message,
          });
        }
        break;

      default:
        console.log("Invalid payment method:", paymentMethod);
        res.status(400).json({ error: "Invalid payment method" });
    }
  } catch (error) {
    console.error("Detailed error creating payment intent:", error);
    res.status(500).json({
      error: "An error occurred while processing the payment.",
      details: error.message,
    });
  }
};

exports.paypalpayment = async (req, res) => {
  const { amount } = req.query;
  console.log("Creating PayPal order for amount:", amount);
  try {
    console.log("Trying to create paypal order");
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "THB",
            value: amount,
          },
        },
      ],
    });

    const order = await paypalClient.execute(request);
    console.log("PayPal order created:", order);
    const approveUrl = order.result.links.find(
      (link) => link.rel === "approve"
    ).href;
    res.redirect(approveUrl);
  } catch (error) {
    console.error("PayPal order creation failed:", error);
    res.status(500).send("Failed to create PayPal payment");
  }
};

exports.checkpaypalpaymentstatus = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Order token is missing" });
    }

    const request = new paypal.orders.OrdersCaptureRequest(token);
    const capture = await paypalClient.execute(request);

    if (capture.result.status === "COMPLETED") {
      const purchase = await createPurchaseFromPayment(
        capture.result,
        "paypal",
        "completed",
        req.user
      );
      res.json({
        success: true,
        message: "Payment completed successfully",
        purchase,
      });
    } else {
      res.json({ success: false, message: "Payment not completed" });
    }
  } catch (error) {
    console.error("Error checking PayPal payment status:", error);
    res
      .status(500)
      .json({ success: false, message: "Error checking payment status" });
  }
};

exports.createCardPurchase = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res
        .status(400)
        .json({ success: false, message: "Payment not successful" });
    }

    const purchase = await createPurchaseFromPayment(
      paymentIntent,
      "stripe",
      "completed",
      req.user
    );
    res.status(200).json({
      success: true,
      message: "Card purchase created successfully",
      purchase,
    });
  } catch (error) {
    console.error("Error in createCardPurchase:", error);
    res.status(500).json({
      success: false,
      message: "Error creating card purchase",
      error: error.message,
    });
  }
};

exports.createPurchase = async (req, res) => {
  try {
    const { paymentMethod, token, amount } = req.body;

    console.log("서버에서 받은 결제 금액:", amount);

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    let paymentData;
    if (paymentMethod === "omise") {
      console.log("Omise를 사용하여 결제 요청 수행");
      paymentData = await omise.charges.create({
        amount: amount * 100,
        currency: "thb",
        card: token,
        description: "Trip-day.com purchase",
      });
      console.log("Omise로부터 생성된 결제:", paymentData);
    } else {
      console.log("Omise가 아닌 결제 방법을 사용하여 결제 요청 수행");
      paymentData = { id: token };
    }
    console.log("payment created from omise");

    const purchase = await createPurchaseFromPayment(
      paymentData,
      paymentMethod,
      "completed",
      req.user
    );

    // await sendReceiptEmail(req.user.email, purchase);

    res.status(200).json({
      success: true,
      message: "Purchase created successfully",
      purchase,
    });
  } catch (error) {
    console.error("Error in createPurchase:", error);
    res.status(500).json({
      success: false,
      message: "Error creating purchase",
      error: error.message,
    });
  }
};

exports.handleWebhook = async (req, res) => {
  const provider = req.params.provider;
  let event;

  try {
    switch (provider) {
      case "stripe":
        const sig = req.headers["stripe-signature"];
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        break;
      case "paypal":
        const webhookId = process.env.PAYPAL_WEBHOOK_ID;
        const requestBody = req.body;
        const transmissionId = req.headers["paypal-transmission-id"];
        const transmissionTime = req.headers["paypal-transmission-time"];
        const certUrl = req.headers["paypal-cert-url"];
        const authAlgo = req.headers["paypal-auth-algo"];
        const transmissionSig = req.headers["paypal-transmission-sig"];

        const verifyResult = await paypal.notifications.verifyWebhookSignature({
          authAlgo,
          transmissionId,
          transmissionSig,
          transmissionTime,
          certUrl,
          webhookId,
          requestBody,
        });

        if (verifyResult.verification_status !== "SUCCESS") {
          throw new Error("PayPal webhook signature verification failed");
        }

        event = requestBody;
        break;
      case "omise":
        const omiseSignature = req.headers["omise-signature"];
        const omiseTimestamp = req.headers["omise-timestamp"];
        const payload = omiseTimestamp + JSON.stringify(req.body);
        const expectedSignature = crypto
          .createHmac("sha256", process.env.OMISE_SECRET_KEY)
          .update(payload)
          .digest("hex");

        if (omiseSignature !== expectedSignature) {
          throw new Error("Omise webhook signature verification failed");
        }

        event = req.body;
        break;
      case "paymentwall":
        const pingback = new Paymentwall.Pingback(req.query, req.ip);

        if (!pingback.validate()) {
          throw new Error("Paymentwall pingback validation failed");
        }

        if (pingback.isDeliverable()) {
          event = {
            type: "payment.success",
            payment: {
              id: pingback.getReferenceId(),
              amount: pingback.getParameter("amount"),
              currency: pingback.getParameter("currency"),
              userId: pingback.getUserId(),
            },
          };
        } else {
          event = {
            type: "payment.failed",
            payment: {
              id: pingback.getReferenceId(),
              error: "Payment not deliverable",
            },
          };
        }
        break;
      default:
        return res
          .status(400)
          .send(`Unsupported payment provider: ${provider}`);
    }

    switch (provider) {
      case "stripe":
        await handleStripeEvent(event);
        break;
      case "paypal":
        await handlePayPalEvent(event);
        break;
      case "omise":
        await handleOmiseEvent(event);
        break;
      case "paymentwall":
        await handlePaymentwallEvent(event);
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`Error processing ${provider} webhook:`, err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

async function handleStripeEvent(event) {
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log("Stripe PaymentIntent succeeded:", paymentIntent.id);

      await handleSuccessfulPayment(paymentIntent, "stripe");
      break;
    case "payment_intent.payment_failed":
      const failedPaymentIntent = event.data.object;
      console.log("Stripe PaymentIntent failed:", failedPaymentIntent.id);
      await handleFailedPayment(failedPaymentIntent, "stripe");
      break;
    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }
}

async function handlePayPalEvent(event) {
  switch (event.event_type) {
    case "PAYMENT.CAPTURE.COMPLETED":
      const payment = event.resource;
      console.log("PayPal payment completed:", payment.id);
      await handleSuccessfulPayment(payment, "paypal");
      break;
    case "PAYMENT.CAPTURE.DENIED":
      const failedPayment = event.resource;
      console.log("PayPal payment failed:", failedPayment.id);
      await handleFailedPayment(failedPayment, "paypal");
      break;
    default:
      console.log(`Unhandled PayPal event type: ${event.event_type}`);
  }
}

async function handleOmiseEvent(event) {
  switch (event.key) {
    case "charge.complete":
      const charge = event.data;
      console.log("Omise charge completed:", charge.id);
      await handleSuccessfulPayment(charge, "omise");
      break;
    case "charge.fail":
      const failedCharge = event.data;
      console.log("Omise charge failed:", failedCharge.id);
      await handleFailedPayment(failedCharge, "omise");
      break;
    default:
      console.log(`Unhandled Omise event type: ${event.key}`);
  }
}

async function handlePaymentwallEvent(event) {
  switch (event.type) {
    case "payment.success":
      const payment = event.payment;
      console.log("Paymentwall payment completed:", payment.id);
      await handleSuccessfulPayment(payment, "paymentwall");
      break;
    case "payment.failed":
      const failedPayment = event.payment;
      console.log("Paymentwall payment failed:", failedPayment.id);
      await handleFailedPayment(failedPayment, "paymentwall");
      break;
    default:
      console.log(`Unhandled Paymentwall event type: ${event.type}`);
  }
}

async function handleSuccessfulPayment(paymentData, provider) {
  try {
    const purchase = await createPurchaseFromPayment(
      paymentData,
      provider,
      "completed"
    );

    return purchase;
  } catch (error) {
    console.error(`Error creating purchase for ${provider} payment:`, error);
  }
}

async function handleFailedPayment(paymentData, provider) {
  try {
    let purchase = null;
    switch (provider) {
      case "stripe":
        purchase = await createPurchaseFromPayment(
          paymentData,
          provider,
          "failed"
        );
        break;
      case "paypal":
        purchase = await createPurchaseFromPayment(
          paymentData,
          provider,
          "failed"
        );
        break;
      case "omise":
        purchase = await createPurchaseFromPayment(
          paymentData,
          provider,
          "failed"
        );
        break;
      case "paymentwall":
        purchase = await createPurchaseFromPayment(
          paymentData,
          provider,
          "failed"
        );
        break;
      case "bank_transfer":
        purchase = await createPurchaseFromPayment(
          paymentData,
          provider,
          "pending"
        );
        break;
      case "crypto":
        purchase = await createPurchaseFromPayment(
          paymentData,
          provider,
          "pending"
        );
        break;
    }

    return purchase;
  } catch (error) {
    console.error(
      `Error recording failed purchase for ${provider} payment:`,
      error
    );
  }
}

async function createPurchaseFromPayment(paymentData, provider, status, user) {
  console.log("Creating purchase from payment:", paymentData);
  try {
    if (!user) {
      throw new Error("User is required for creating purchase");
    }

    const userId = user._id;
    let cart = null;
    cart = await Cart.findOne({ user: userId })
      .populate({
        path: "items.hotel",
        model: "Hotel",
      })
      .populate({
        path: "items.golf",
        model: "Golf",
      })
      .populate({
        path: "items.package",
        model: "Package",
      });

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    const selectedItems = cart.items.filter((item) => item.isSelected);

    if (selectedItems.length === 0) {
      throw new Error("No items selected for purchase");
    }

    const purchases = [];

    for (const item of selectedItems) {
      const hotelName =
        item.hotel && item.hotel.title ? item.hotel.title : "Unknown Hotel";

      // ค้นหา room ใน hotel.rooms
      let roomName = "Unknown Room";
      if (item.hotel && item.room) {
        const room = item.hotel.rooms.find(
          (r) => r._id.toString() === item.room.toString()
        );
        roomName = room ? room.title : roomName;
      }

      let checkInDate, checkOutDate;

      if (item.check_in) {
        checkInDate = new Date(item.check_in);
      } else if (item.hotel && item.hotel.validFrom) {
        checkInDate = new Date(item.hotel.validFrom);
      } else {
        checkInDate = new Date();
      }

      if (item.check_out) {
        checkOutDate = new Date(item.check_out);
      } else if (item.hotel && item.hotel.ExpiredAt) {
        checkOutDate = new Date(item.hotel.ExpiredAt);
      } else {
        const nights = item.quantity || 1;
        checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkOutDate.getDate() + nights);
      }

      if (isNaN(checkInDate.getTime())) {
        checkInDate = new Date();
      }
      if (isNaN(checkOutDate.getTime())) {
        checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkOutDate.getDate() + (item.quantity || 1));
      }

      const purchaseId = createNewId();

      let paymentDetails = null;
      if (provider === "crypto" || provider === "bank_transfer") {
        const FindPaymentMethod = await PaymentMethod.findOne({
          type: provider,
        });
        if (FindPaymentMethod) {
          paymentDetails = FindPaymentMethod._id;
        }
      }

      const amount =
        item.ProductType === "Package"
          ? item.price * item.quantity * item.nights
          : item.price * item.quantity;

      let purchase = null;

      if (item.ProductType == "Hotel") {
        purchase = new Purchase({
          purchaseId: purchaseId,
          user: userId,
          hotelName: hotelName,
          roomName: roomName, 
          checkIn: checkInDate,
          checkOut: checkOutDate,
          nights: item.quantity || 1,
          amount: amount,
          paymentMethod: provider,
          paymentDetails: paymentDetails,
          status: status === "completed" ? "Paid" : "Pending",
          processDescription:
            status === "completed" ? "Payment successful" : "Payment Pending",
          purchaseLog: [
            {
              message:
                status === "completed"
                  ? "Purchase completed"
                  : "Purchase Pending",
            },
          ],
        });
      } else if (item.ProductType == "Golf") {
        purchase = new Purchase({
          purchaseId: purchaseId,
          user: userId,
          hotelName: item.golf.title,
          roomName: item.golf.title,
          checkIn: new Date(),
          checkOut: new Date(),
          nights: item.quantity || 1,
          amount: amount,
          paymentMethod: provider,
          paymentDetails: paymentDetails,
          status: status === "completed" ? "Paid" : "Pending",
          processDescription:
            status === "completed" ? "Payment successful" : "Payment Pending",
          purchaseLog: [
            {
              message:
                status === "completed"
                  ? "Purchase completed"
                  : "Purchase Pending",
            },
          ],
        });
      } else {
        purchase = new Purchase({
          purchaseId: purchaseId,
          user: userId,
          hotelName: item.package.title,
          roomName: item.package.title,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          nights: item.quantity || 1,
          amount: amount,
          paymentMethod: provider,
          paymentDetails: paymentDetails,
          status: status === "completed" ? "Paid" : "Pending",
          processDescription:
            status === "completed" ? "Payment successful" : "Payment Pending",
          purchaseLog: [
            {
              message:
                status === "completed"
                  ? "Purchase completed"
                  : "Purchase Pending",
            },
          ],
        });
      }

      switch (provider) {
        case "stripe":
          purchase.stripePaymentIntentId = paymentData.id;
          break;
        case "paypal":
          purchase.paypalPaymentId = paymentData.id;
          break;
        case "omise":
          purchase.omiseChargeId = paymentData.id;
          break;
        case "paymentwall":
          purchase.paymentwallChargeId = paymentData.id;
          break;
      }

      await purchase.save();
      purchases.push(purchase);
    }

    await Cart.findOneAndUpdate(
      { user: userId },
      { $pull: { items: { isSelected: true } } }
    );

    return purchases;
  } catch (error) {
    console.error("Error in createPurchaseFromPayment:", error);
    throw error;
  }
}

function createNewId() {
  const date = new Date();
  const formattedDate = date.toISOString().slice(2, 10).replace(/-/g, "");
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `#${formattedDate}${randomChars}`;
}

async function sendReceiptEmail(email, purchase) {
  const messageContent = `
  Purchase Confirmation
  Thank you for your purchase. Here are the details:

  Product: ${purchase[0].hotelName}

  Nights: ${purchase[0].nights}
  Amount: THB ${purchase[0].amount}
  Payment Method: ${purchase[0].paymentMethod}
  Status: ${purchase[0].status}`;
  const userEmail = email;
  const message = new Message({
    content: messageContent,
    email: email,
    recipient: email,
    type: "purchase_confirmation",
    isIndividualMesssage: true,
    isCustomerServiceMessage: false,
    isRead: false,
    readAt: null,
  });

  await message.save();

  const receiptItemsHtml = purchase
    .map((purchases) => {
      return `
    <div style="font-family: Arial, sans-serif; border: 1px solid #ccc; padding: 20px; width: 100%; max-width: 600px; margin: 0 auto;">
    <h2 style="text-align: center; color: #1E4DEF;">Trip-day Purchase Receipt</h2>
    <hr style="border: 0; height: 1px; background-color: #1E4DEF;">
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;"><strong>Purchase ID:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;">${purchases.purchaseId}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;"><strong>Hotel:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;">${purchases.hotelName}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;"><strong>Room:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;">${purchases.roomName}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;"><strong>Quantity:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;">${purchases.nights} nights</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;"><strong>Payment Method:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;">${purchases.paymentMethod}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;"><strong>Status:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;">${purchases.status}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;"><strong>Price:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;">THB ${purchases.amount}</td>
      </tr>
    </table>
    <hr style="border: 0; height: 1px; background-color: #1E4DEF;">
    <p style="text-align: center;">Thank you for your purchase!</p>
  </div>
  
    `;
    })
    .join("");

  const receiptHtml = `
    <h1>Trip-day Purchase Receipt</h1>
     <p>Thank you for your purchase!</p>
    ${receiptItemsHtml}
    <p>Please contact us if you have any questions.</p>
  `;

  bot.sendMessage(
    process.env.TELGRAM_CHAT_ID,
    `결제가 완료되어 영수증이 발행되었습니다.`
  );

  const data = {
    from: "Trip-day <sandbox00b99d1f183b4ebd85b771c9514bf0a7@mailgun.org>",
    to: email,
    subject: "Trip-day Purcvhase Receipt",
    html: receiptHtml,
  };

  return new Promise((resolve, reject) => {
    mailgun.messages().send(data, (error, body) => {
      if (error) {
        console.error("Error sending receipt email:", error);
        reject(error);
      } else {
        console.log("Receipt email sent successfully:", body);
        resolve(body);
      }
    });
  });
}

module.exports = exports;
