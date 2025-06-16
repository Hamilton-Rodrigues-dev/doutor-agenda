import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { usersTable } from "@/db/schema";

export const POST = async (request: Request) => {
  console.log("🚀 [STRIPE-WEBHOOK] Webhook recebido");

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("❌ [STRIPE-WEBHOOK] Variáveis de ambiente ausentes");
    throw new Error("Stripe secret key not found");
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    console.error("❌ [STRIPE-WEBHOOK] Assinatura não encontrada");
    throw new Error("Stripe signature not found");
  }

  const text = await request.text();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
  });

  try {
    const event = stripe.webhooks.constructEvent(
      text,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    console.log("✅ [STRIPE-WEBHOOK] Evento verificado:", {
      type: event.type,
      id: event.id,
    });

    switch (event.type) {
      case "checkout.session.completed": {
        console.log(
          "🛒 [STRIPE-WEBHOOK] Processando checkout.session.completed",
        );

        const session = event.data.object as Stripe.Checkout.Session;

        console.log("📋 [STRIPE-WEBHOOK] Dados da sessão:", {
          id: session.id,
          customer: session.customer,
          subscription: session.subscription,
          client_reference_id: session.client_reference_id,
          metadata: session.metadata,
        });

        const userId = session.client_reference_id || session.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) {
          console.error("❌ [STRIPE-WEBHOOK] userId não encontrado na sessão");
          break;
        }

        if (!customerId || !subscriptionId) {
          console.error("❌ [STRIPE-WEBHOOK] Dados faltando:", {
            customerId,
            subscriptionId,
          });
          break;
        }

        console.log(
          "👤 [STRIPE-WEBHOOK] Atualizando usuário via checkout.session.completed:",
          {
            userId,
            customerId,
            subscriptionId,
          },
        );

        await db
          .update(usersTable)
          .set({
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan: "essential",
          })
          .where(eq(usersTable.id, userId));

        console.log("✅ [STRIPE-WEBHOOK] Usuário atualizado com sucesso");
        break;
      }

      case "invoice.paid": {
        console.log("💰 [STRIPE-WEBHOOK] Processando invoice.paid");

        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string;
        };

        // Access subscription property with type assertion if not present in Stripe.Invoice type
        const subscriptionId = invoice.subscription ?? undefined;

        if (!subscriptionId) {
          console.error(
            "❌ [STRIPE-WEBHOOK] Subscription ID não encontrado no invoice",
          );
          break;
        }

        console.log(
          "🔍 [STRIPE-WEBHOOK] Buscando subscription:",
          subscriptionId,
        );

        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);

        const userId = subscription.metadata.userId;

        if (!userId) {
          console.error(
            "❌ [STRIPE-WEBHOOK] userId não encontrado nos metadata:",
            {
              metadata: subscription.metadata,
            },
          );
          break;
        }

        console.log(
          "👤 [STRIPE-WEBHOOK] Atualizando usuário via invoice.paid:",
          {
            userId,
            subscriptionId: subscription.id,
            customerId: subscription.customer,
          },
        );

        await db
          .update(usersTable)
          .set({
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            plan: "essential",
          })
          .where(eq(usersTable.id, userId));

        console.log(
          "✅ [STRIPE-WEBHOOK] Usuário atualizado com sucesso via invoice.paid",
        );
        break;
      }

      case "customer.subscription.deleted": {
        console.log("🗑️ [STRIPE-WEBHOOK] Processando subscription.deleted");

        const subscription = event.data.object as Stripe.Subscription;

        const userId = subscription.metadata?.userId;
        if (!userId) {
          console.error(
            "❌ [STRIPE-WEBHOOK] User ID not found in deleted subscription metadata",
          );
          return NextResponse.json({ received: true });
        }

        console.log("👤 [STRIPE-WEBHOOK] Removendo plano do usuário:", userId);

        await db
          .update(usersTable)
          .set({
            stripeSubscriptionId: null,
            stripeCustomerId: null,
            plan: null,
          })
          .where(eq(usersTable.id, userId));

        console.log("✅ [STRIPE-WEBHOOK] Plano removido com sucesso");
        break;
      }

      default:
        console.log("ℹ️ [STRIPE-WEBHOOK] Evento não tratado:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ [STRIPE-WEBHOOK] Erro:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
};
