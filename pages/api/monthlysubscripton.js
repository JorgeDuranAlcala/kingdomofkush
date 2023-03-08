import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function monthlysubscripton(req, res) {
  try {
    if (req.method != "POST") return res.status(400);
    // payment details
    const { name, email, paymentMethod, time, amount } = req.body;
    // crate a customer
    const customer = await stripe.customers.create({
      name,
      email,
      payment_method: paymentMethod,
      invoice_settings: {
        default_payment_method: paymentMethod,
      },
    });

    if (!time === "month") return;
    
    const monthly = await stripe.products.create({
      name: "Monthly Subscripton",
    });

    // create a sbuscription
    const monthlySubscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price_data: {
            currency: "USD",
            product: monthly.id,
            unit_amount: amount * 100,
            recurring: {
              interval: "month",
            },
          },
        },
      ],

      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },

      expand: [`latest_invoice.payment_intent`],
    });
    // send back the client secret
    res.send({
      message: "Subscription Successfull",
      clientSecret: monthlySubscription.latest_invoice.payment_intent,
      subscriptionId: monthlySubscription.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}
