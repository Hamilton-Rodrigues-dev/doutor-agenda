import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { usersTable } from "@/db/schema";

interface StripeInvoice {
  id: string;
  subscription?: string;
  customer: string;
  amount_paid: number;
  status: string;
  object: string;
  billing_reason?: string;
  lines?: {
    data?: Array<{
      subscription?: string;
    }>;
  };
}

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
      case "invoice.paid":
      case "invoice.payment_succeeded": {
        console.log(`💰 [STRIPE-WEBHOOK] Processando ${event.type}`);

        const invoice = event.data.object as StripeInvoice;

        console.log("📋 [STRIPE-WEBHOOK] Dados completos do invoice:", {
          id: invoice.id,
          subscription: invoice.subscription,
          customer: invoice.customer,
          amount_paid: invoice.amount_paid,
          status: invoice.status,
          object: invoice.object,
          lines_data_length: invoice.lines?.data?.length,
          first_line_subscription: invoice.lines?.data?.[0]?.subscription,
          billing_reason: invoice.billing_reason,
        });

        // Tentar obter subscription ID de diferentes formas
        let subscriptionId = invoice.subscription;

        // Se não tiver na propriedade subscription, tentar nas lines do invoice
        if (!subscriptionId && invoice.lines?.data?.[0]?.subscription) {
          subscriptionId = invoice.lines.data[0].subscription;
          console.log(
            "🔍 [STRIPE-WEBHOOK] Subscription ID encontrado nas lines:",
            subscriptionId,
          );
        }

        if (!subscriptionId) {
          console.error(
            "❌ [STRIPE-WEBHOOK] Subscription ID não encontrado no invoice:",
            {
              invoiceId: invoice.id,
              subscription: invoice.subscription,
              billing_reason: invoice.billing_reason,
              lines_count: invoice.lines?.data?.length,
            },
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

        console.log("👤 [STRIPE-WEBHOOK] Atualizando usuário via invoice:", {
          userId,
          subscriptionId: subscription.id,
          customerId: subscription.customer,
        });

        await db
          .update(usersTable)
          .set({
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            plan: "essential",
          })
          .where(eq(usersTable.id, userId));

        console.log(
          "✅ [STRIPE-WEBHOOK] Usuário atualizado com sucesso via invoice",
        );
        break;
      }

      case "customer.subscription.created": {
        console.log("🆕 [STRIPE-WEBHOOK] Processando subscription.created");

        const subscription = event.data.object as Stripe.Subscription;

        const userId = subscription.metadata?.userId;
        if (!userId) {
          console.error(
            "❌ [STRIPE-WEBHOOK] User ID not found in subscription metadata",
          );
          break;
        }

        console.log(
          "👤 [STRIPE-WEBHOOK] Atualizando usuário via subscription.created:",
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
          "✅ [STRIPE-WEBHOOK] Usuário atualizado via subscription.created",
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

      case "customer.created": {
        console.log("🆕 [STRIPE-WEBHOOK] Processando customer.created");

        const customer = event.data.object as Stripe.Customer;

        console.log("📋 [STRIPE-WEBHOOK] Dados do cliente:", {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          created: new Date(customer.created * 1000).toISOString(),
          metadata: customer.metadata,
        });

        const userId = customer.metadata?.userId;

        if (userId) {
          console.log(
            `👤 [STRIPE-WEBHOOK] Atualizando usuário ${userId} com stripeCustomerId`,
          );

          await db
            .update(usersTable)
            .set({
              stripeCustomerId: customer.id,
            })
            .where(eq(usersTable.id, userId));

          console.log(
            "✅ [STRIPE-WEBHOOK] Usuário atualizado com stripeCustomerId",
          );
        } else {
          console.log(
            "ℹ️ [STRIPE-WEBHOOK] Nenhum userId encontrado no metadata do cliente Stripe, nenhum usuário atualizado",
          );
        }

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
export const config = {
  api: {
    bodyParser: false,
  },
};
