"use server";

import { headers } from "next/headers";
import Stripe from "stripe";

import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const createStripeCheckout = actionClient.action(async () => {
  console.log("🚀 [CREATE-STRIPE-CHECKOUT] Iniciando criação do checkout");

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    console.error("❌ [CREATE-STRIPE-CHECKOUT] Usuário não autenticado");
    throw new Error("Unauthorized");
  }

  console.log("✅ [CREATE-STRIPE-CHECKOUT] Usuário autenticado:", {
    userId: session.user.id,
    email: session.user.email,
  });

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error(
      "❌ [CREATE-STRIPE-CHECKOUT] STRIPE_SECRET_KEY não encontrada",
    );
    throw new Error("Stripe secret key not found");
  }

  if (!process.env.STRIPE_ESSENTIAL_PLAN_PRICE_ID) {
    console.error(
      "❌ [CREATE-STRIPE-CHECKOUT] STRIPE_ESSENTIAL_PLAN_PRICE_ID não encontrada",
    );
    throw new Error("Stripe price ID not found");
  }

  console.log("✅ [CREATE-STRIPE-CHECKOUT] Variáveis de ambiente OK");

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
  });

  try {
    console.log("🔄 [CREATE-STRIPE-CHECKOUT] Criando sessão do Stripe...");

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      customer_email: session.user.email,
      client_reference_id: session.user.id,
      metadata: {
        userId: session.user.id,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
        },
      },
      line_items: [
        {
          price: process.env.STRIPE_ESSENTIAL_PLAN_PRICE_ID,
          quantity: 1,
        },
      ],
    });

    console.log("✅ [CREATE-STRIPE-CHECKOUT] Sessão criada com sucesso:", {
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      userId: session.user.id,
      client_reference_id: checkoutSession.client_reference_id,
    });

    return {
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    };
  } catch (error) {
    console.error("❌ [CREATE-STRIPE-CHECKOUT] Erro ao criar sessão:", error);
    throw new Error("Failed to create checkout session");
  }
});
