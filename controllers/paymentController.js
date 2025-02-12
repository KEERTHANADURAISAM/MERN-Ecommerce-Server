import crypto from 'crypto';
import Razorpay from 'razorpay';

const config = (req, res) =>
  res.send({
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET
  });

// Create an order with Razorpay
const order = async (req, res, next) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // Get the order options from the request body
    const options = req.body;

    // Create a new order
    const order = await razorpay.orders.create(options);

    if (!order) {
      res.statusCode = 500;
      throw new Error('No order created');
    }

    // Return the created order to the frontend
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

// Validate Razorpay payment using HMAC
const validate = (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  // If the signature is invalid, throw an error
  if (generatedSignature !== razorpay_signature) {
    res.statusCode = 400;
    throw new Error('Payment signature is not valid');
  }

  // Payment is successful
  res.status(201).json({
    id: razorpay_payment_id,
    status: 'success',
    message: 'Payment successful',
    updateTime: new Date().toLocaleTimeString()
  });
};

export { config, order, validate };
