import { FundTransactionType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createFundTransactionSchema = z.object({
  accountId: z.string().min(1),
  symbol: z.string().min(1),
  transactionType: z.nativeEnum(FundTransactionType),
  units: z.number().nonnegative().default(0),
  price: z.number().nonnegative().default(0),
  amount: z.number(),
  fee: z.number().nonnegative().default(0),
  transactionAt: z.coerce.date(),
  notes: z.string().optional(),
});

type HoldingAggregate = {
  units: number;
  netCash: number;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");

  if (!accountId) {
    return NextResponse.json({ error: "accountId is required." }, { status: 400 });
  }

  const transactions = await prisma.fundTransaction.findMany({
    where: { accountId },
    orderBy: { transactionAt: "desc" },
  });

  const holdings = transactions.reduce<Record<string, HoldingAggregate>>((acc, tx) => {
    if (!acc[tx.symbol]) {
      acc[tx.symbol] = { units: 0, netCash: 0 };
    }

    if (tx.transactionType === FundTransactionType.BUY) {
      acc[tx.symbol].units += tx.units;
      acc[tx.symbol].netCash += tx.amount + tx.fee;
    }

    if (tx.transactionType === FundTransactionType.SELL) {
      acc[tx.symbol].units -= tx.units;
      acc[tx.symbol].netCash -= tx.amount - tx.fee;
    }

    if (tx.transactionType === FundTransactionType.DIVIDEND) {
      acc[tx.symbol].netCash -= tx.amount;
    }

    if (tx.transactionType === FundTransactionType.FEE) {
      acc[tx.symbol].netCash += tx.amount;
    }

    return acc;
  }, {});

  const positions = Object.entries(holdings).map(([symbol, v]) => ({
    symbol,
    units: Number(v.units.toFixed(4)),
    holdingCost: Number(v.netCash.toFixed(2)),
    averageCost: v.units > 0 ? Number((v.netCash / v.units).toFixed(4)) : 0,
  }));

  return NextResponse.json({ transactions, positions });
}

export async function POST(req: Request) {
  const authResult = await requireAdminApi();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const payload = createFundTransactionSchema.parse(await req.json());
    const created = await prisma.fundTransaction.create({ data: payload });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create fund transaction." }, { status: 500 });
  }
}
