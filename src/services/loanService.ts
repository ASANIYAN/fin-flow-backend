import { Prisma, PrismaClient, LoanStatus } from "../lib/prisma";

interface CreateLoanInput {
  title: string;
  description?: string | null;
  amountRequested: number;
  interestRate: number;
  duration: number;
  borrowerId: string;
}

interface BorrowerDashboardData {
  totalApplications: number;
  pendingApplications: number;
  activeLoans: LoanWithDetails[];
}

interface InvestmentSummary {
  totalInvested: number;
  totalEarnings: number;
  activeInvestments: number;
}

interface LoanListing {
  id: string;
  title: string;
  description: string | null;
  amountRequested: number;
  amountFunded: number;
  interestRate: number;
  duration: number;
  status: LoanStatus;
  borrower: string;
  progress: number;
  createdAt: Date;
}

interface LenderDashboardData {
  investmentSummary: InvestmentSummary;
  newListings: LoanListing[];
}

interface LoanWithDetails {
  id: string;
  title: string;
  description: string | null;
  amountRequested: number;
  amountFunded: number;
  interestRate: number;
  duration: number;
  status: LoanStatus;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_EARNINGS_RATE = 0.05; // 5% simplified earnings calculation
const MAX_NEW_LISTINGS = 10;

const prisma = new PrismaClient();

const calculateProgress = (
  amountFunded: number,
  amountRequested: number
): number => {
  if (amountRequested === 0) return 0;
  return (amountFunded / amountRequested) * 100;
};

const formatBorrowerName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`;
};

const convertDecimalToNumber = (
  decimal: Prisma.Decimal | number | null | undefined
): number => {
  if (decimal && typeof decimal === "object" && "toNumber" in decimal) {
    return decimal.toNumber();
  }
  return Number(decimal) || 0;
};

const getLoanCountByBorrower = async (borrowerId: string): Promise<number> => {
  return prisma.loan.count({
    where: { borrowerId },
  });
};

const getPendingLoanCountByBorrower = async (
  borrowerId: string
): Promise<number> => {
  return prisma.loan.count({
    where: {
      borrowerId,
      status: LoanStatus.PENDING,
    },
  });
};

const getActiveLoansByBorrower = async (
  borrowerId: string
): Promise<
  Array<{
    id: string;
    title: string;
    description: string | null;
    amountRequested: Prisma.Decimal;
    amountFunded: Prisma.Decimal;
    interestRate: Prisma.Decimal;
    duration: number;
    status: LoanStatus;
    createdAt: Date;
    updatedAt: Date;
    borrowerId: string;
  }>
> => {
  return prisma.loan.findMany({
    where: {
      borrowerId,
      status: {
        in: [LoanStatus.FUNDING, LoanStatus.FUNDED],
      },
    },
  });
};

const getInvestmentsByLender = async (
  lenderId: string
): Promise<
  Array<{
    amountFunded: Prisma.Decimal;
    interestRate: Prisma.Decimal;
  }>
> => {
  return prisma.loan.findMany({
    where: {
      fundedBy: {
        some: { id: lenderId },
      },
    },
    select: {
      amountFunded: true,
      interestRate: true,
    },
  });
};

const getRecentLoanListings = async (
  limit: number = MAX_NEW_LISTINGS
): Promise<
  Array<{
    id: string;
    title: string;
    description: string | null;
    amountRequested: Prisma.Decimal;
    amountFunded: Prisma.Decimal;
    interestRate: Prisma.Decimal;
    duration: number;
    status: LoanStatus;
    createdAt: Date;
    updatedAt: Date;
    borrowerId: string;
    borrower: {
      firstName: string;
      lastName: string;
    };
  }>
> => {
  return prisma.loan.findMany({
    where: { status: LoanStatus.PENDING },
    take: limit,
    include: {
      borrower: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const calculateInvestmentSummary = (
  investments: Array<{
    amountFunded: Prisma.Decimal;
    interestRate: Prisma.Decimal;
  }>
): InvestmentSummary => {
  const totalInvested = investments.reduce(
    (sum, loan) => sum + convertDecimalToNumber(loan.amountFunded),
    0
  );

  // Simplified earnings calculation - should be more sophisticated later on
  const totalEarnings = totalInvested * DEFAULT_EARNINGS_RATE;
  const activeInvestments = investments.length;

  return {
    totalInvested,
    totalEarnings,
    activeInvestments,
  };
};

const formatLoanListings = (
  loans: Array<{
    id: string;
    title: string;
    description: string | null;
    amountRequested: Prisma.Decimal;
    amountFunded: Prisma.Decimal;
    interestRate: Prisma.Decimal;
    duration: number;
    status: LoanStatus;
    createdAt: Date;
    updatedAt: Date;
    borrowerId: string;
    borrower: {
      firstName: string;
      lastName: string;
    };
  }>
): LoanListing[] => {
  return loans.map((loan) => ({
    id: loan.id,
    title: loan.title,
    description: loan.description,
    amountRequested: convertDecimalToNumber(loan.amountRequested),
    amountFunded: convertDecimalToNumber(loan.amountFunded),
    interestRate: convertDecimalToNumber(loan.interestRate),
    duration: loan.duration,
    status: loan.status,
    borrower: formatBorrowerName(
      loan.borrower.firstName,
      loan.borrower.lastName
    ),
    progress: calculateProgress(
      convertDecimalToNumber(loan.amountFunded),
      convertDecimalToNumber(loan.amountRequested)
    ),
    createdAt: loan.createdAt,
  }));
};

/**
 * Create a new loan application
 * @param loanData - Loan creation data
 * @returns Created loan object
 */
export const createLoanService = async (loanData: CreateLoanInput) => {
  const prismaLoanData: Prisma.LoanCreateInput = {
    title: loanData.title,
    description: loanData.description,
    amountRequested: loanData.amountRequested,
    interestRate: loanData.interestRate,
    duration: loanData.duration,
    borrower: {
      connect: { id: loanData.borrowerId },
    },
  };

  return prisma.loan.create({
    data: prismaLoanData,
    include: {
      borrower: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
};

/**
 * Get comprehensive dashboard data for a borrower
 * @param userId - Borrower's user ID
 * @returns Borrower dashboard data
 */
export const getBorrowerDashboardData = async (
  userId: string
): Promise<BorrowerDashboardData> => {
  const [totalApplications, pendingApplications, activeLoans] =
    await Promise.all([
      getLoanCountByBorrower(userId),
      getPendingLoanCountByBorrower(userId),
      getActiveLoansByBorrower(userId),
    ]);

  return {
    totalApplications,
    pendingApplications,
    activeLoans: activeLoans.map((loan) => ({
      id: loan.id,
      title: loan.title,
      description: loan.description,
      amountRequested: convertDecimalToNumber(loan.amountRequested),
      amountFunded: convertDecimalToNumber(loan.amountFunded),
      interestRate: convertDecimalToNumber(loan.interestRate),
      duration: loan.duration,
      status: loan.status,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
    })),
  };
};

/**
 * Get comprehensive dashboard data for a lender
 * @param userId - Lender's user ID
 * @returns Lender dashboard data
 */
export const getLenderDashboardData = async (
  userId: string
): Promise<LenderDashboardData> => {
  const [investments, newListings] = await Promise.all([
    getInvestmentsByLender(userId),
    getRecentLoanListings(),
  ]);

  const investmentSummary = calculateInvestmentSummary(investments);
  const formattedListings = formatLoanListings(newListings);

  return {
    investmentSummary,
    newListings: formattedListings,
  };
};

export const fundLoanService = async (
  loanId: string,
  lenderId: string,
  amount: number
) => {
  return prisma.$transaction(async (prisma: any) => {
    // 1. Get lender and loan data, and lock the records
    const lender = await prisma.user.findUnique({
      where: { id: lenderId },
    });
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new Error("Loan not found.");
    }

    if (!lender || lender.balance.toNumber() < amount) {
      throw new Error("Insufficient funds in wallet.");
    }

    // 2. Determine the exact amount to fund
    const remainingAmount =
      loan.amountRequested.toNumber() - loan.amountFunded.toNumber();
    const fundingAmount = Math.min(amount, remainingAmount);

    if (fundingAmount <= 0) {
      throw new Error(
        "Loan is already fully funded or not available for funding."
      );
    }

    // 3. Debit the lender's wallet
    const newLenderBalance = lender.balance.toNumber() - fundingAmount;
    await prisma.user.update({
      where: { id: lenderId },
      data: { balance: newLenderBalance },
    });
    await prisma.transaction.create({
      data: {
        userId: lenderId,
        loanId: loanId,
        amount: fundingAmount,
        type: "LOAN_FUNDING",
        description: "Contribution to loan funding",
      },
    });

    // 4. Update the loan's funded amount
    const newAmountFunded = loan.amountFunded.toNumber() + fundingAmount;
    let newLoanStatus = loan.status;

    // 5. Check if the loan is fully funded and update status
    if (newAmountFunded >= loan.amountRequested.toNumber()) {
      newLoanStatus = LoanStatus.FUNDED;

      // 6. Automatically credit the borrower's wallet
      const borrower = await prisma.user.findUnique({
        where: { id: loan.borrowerId },
      });
      if (borrower) {
        const newBorrowerBalance =
          borrower.balance.toNumber() + loan.amountRequested.toNumber();
        await prisma.user.update({
          where: { id: borrower.id },
          data: { balance: newBorrowerBalance },
        });

        // Record the disbursement transaction
        await prisma.transaction.create({
          data: {
            userId: borrower.id,
            loanId: loanId,
            amount: loan.amountRequested.toNumber(),
            type: "DISBURSEMENT",
            description: "Loan funds disbursed to borrower",
          },
        });
      }
    }

    // Update loan record with new funded amount and status
    await prisma.loan.update({
      where: { id: loanId },
      data: {
        amountFunded: newAmountFunded,
        status: newLoanStatus,
      },
    });

    return { message: "Loan funded successfully." };
  });
};

export const getOpenLoansService = async (
  page: number,
  pageSize: number,
  query?: string,
  minAmount?: number,
  maxAmount?: number,
  sortBy?: string
) => {
  const skip = (page - 1) * pageSize;

  // Build the dynamic 'where' clause for filtering and searching
  const where: any = {
    status: {
      in: [LoanStatus.PENDING, LoanStatus.FUNDING],
    },
  };

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  if (minAmount) {
    where.amountRequested = { ...where.amountRequested, gte: minAmount };
  }

  if (maxAmount) {
    where.amountRequested = { ...where.amountRequested, lte: maxAmount };
  }

  // Build the dynamic 'orderBy' clause for sorting
  const orderBy: any = sortBy ? {} : { createdAt: "desc" };
  if (sortBy) {
    const [field, direction] = sortBy.split("_");
    orderBy[field] = direction;
  }

  // Fetch the paginated loans
  const loans = await prisma.loan.findMany({
    where,
    skip,
    take: pageSize,
    select: {
      id: true,
      title: true,
      description: true,
      amountRequested: true,
      amountFunded: true,
      interestRate: true,
      duration: true,
      createdAt: true,
      borrower: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy,
  });

  // Get the total count of loans for pagination (without skip/take)
  const totalCount = await prisma.loan.count({ where });
  const totalPages = Math.ceil(totalCount / pageSize);

  return { loans, totalCount, totalPages };
};
