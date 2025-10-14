import {
  LoanStatus,
  TransactionType,
  DurationUnit,
} from "../../node_modules/.prisma/client";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../lib/prisma";

// Utility function to convert duration to days for consistent calculations
const convertDurationToDays = (duration: number, unit: string): number => {
  switch (unit) {
    case "DAYS":
      return duration;
    case "WEEKS":
      return duration * 7;
    case "MONTHS":
      return duration * 30; // Approximate 30 days per month
    case "YEARS":
      return duration * 365; // Approximate 365 days per year
    default:
      return duration * 30; // Default to months if unit is invalid
  }
};

// Utility function to convert duration to months for financial calculations
const convertDurationToMonths = (duration: number, unit: string): number => {
  switch (unit) {
    case "DAYS":
      return duration / 30; // Approximate
    case "WEEKS":
      return duration / 4.33; // Approximate 4.33 weeks per month
    case "MONTHS":
      return duration;
    case "YEARS":
      return duration * 12;
    default:
      return duration; // Default to months if unit is invalid
  }
};

// Utility function to calculate total interest based on amount, rate, duration and unit
const calculateTotalInterest = (
  amountRequested: number,
  interestRate: number,
  duration: number,
  durationUnit: DurationUnit
): number => {
  const ratePerPeriod = interestRate / 100;
  let periodsPerYear = 12;

  switch (durationUnit) {
    case DurationUnit.DAYS:
      periodsPerYear = 365;
      break;
    case DurationUnit.WEEKS:
      periodsPerYear = 52;
      break;
    case DurationUnit.YEARS:
      periodsPerYear = 1;
      break;
    case DurationUnit.MONTHS:
    default:
      periodsPerYear = 12;
      break;
  }

  const timeInYears = duration / periodsPerYear;
  const totalInterest = amountRequested * ratePerPeriod * timeInYears;
  return parseFloat(totalInterest.toFixed(2));
};

interface CreateLoanInput {
  title: string;
  description?: string | null;
  amountRequested: number;
  interestRate: number;
  duration: number;
  durationUnit?: string;
  borrowerId: string;
}

interface UpdateLoanInput {
  title?: string;
  description?: string | null;
  amountRequested?: number;
  interestRate?: number;
  duration?: number;
  durationUnit?: string;
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
  decimal: Decimal | number | null | undefined
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
    amountRequested: Decimal;
    amountFunded: Decimal;
    interestRate: Decimal;
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
        in: [LoanStatus.FUNDING, LoanStatus.PENDING],
      },
    },
  });
};

const getInvestmentsByLender = async (
  lenderId: string
): Promise<
  Array<{
    amountFunded: Decimal;
    interestRate: Decimal;
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
  limit: number = MAX_NEW_LISTINGS,
  excludeUserId?: string
): Promise<
  Array<{
    id: string;
    title: string;
    description: string | null;
    amountRequested: Decimal;
    amountFunded: Decimal;
    interestRate: Decimal;
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
  const where: any = { status: LoanStatus.PENDING };

  // Exclude loans created by the specified user (self-exclusion)
  if (excludeUserId) {
    where.borrowerId = { not: excludeUserId };
  }

  return prisma.loan.findMany({
    where,
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
    amountFunded: Decimal;
    interestRate: Decimal;
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
    amountRequested: Decimal;
    amountFunded: Decimal;
    interestRate: Decimal;
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
  return loans.map(
    (loan: {
      id: string;
      title: string;
      description: string | null;
      amountRequested: Decimal;
      amountFunded: Decimal;
      interestRate: Decimal;
      duration: number;
      status: LoanStatus;
      createdAt: Date;
      updatedAt: Date;
      borrower: {
        firstName: string;
        lastName: string;
      };
    }) => ({
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
    })
  );
};

/**
 * Create a new loan application
 * @param loanData - Loan creation data
 * @returns Created loan object
 */
export const createLoanService = async (loanData: CreateLoanInput) => {
  const durationUnit = (loanData.durationUnit as any) || "MONTHS";
  const totalInterest = calculateTotalInterest(
    loanData.amountRequested,
    loanData.interestRate,
    loanData.duration,
    durationUnit
  );

  const prismaLoanData = {
    title: loanData.title,
    description: loanData.description,
    amountRequested: loanData.amountRequested,
    interestRate: loanData.interestRate,
    duration: loanData.duration,
    durationUnit: durationUnit,
    totalInterest: totalInterest,
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
 * Delete a loan application
 * @param loanId - ID of the loan to delete
 * @param borrowerId - ID of the borrower (for authorization)
 * @returns Deleted loan object
 */
export const deleteLoanService = async (loanId: string, borrowerId: string) => {
  // First, verify the loan exists and belongs to the borrower
  const existingLoan = await prisma.loan.findUnique({
    where: { id: loanId },
    select: {
      id: true,
      borrowerId: true,
      status: true,
      amountFunded: true,
    },
  });

  if (!existingLoan) {
    throw new Error("Loan not found.");
  }

  if (existingLoan.borrowerId !== borrowerId) {
    throw new Error("You can only delete your own loan applications.");
  }

  // Only allow deletion if the loan is still in PENDING status and hasn't been funded
  if (
    existingLoan.status !== "PENDING" ||
    existingLoan.amountFunded.toNumber() > 0
  ) {
    throw new Error(
      "Can only delete loans that are in PENDING status and have not received any funding."
    );
  }

  // Delete the loan
  return prisma.loan.delete({
    where: { id: loanId },
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
 * Update an existing loan application
 * @param loanId - ID of the loan to update
 * @param borrowerId - ID of the borrower (for authorization)
 * @param updateData - Data to update
 * @returns Updated loan object
 */
export const updateLoanService = async (
  loanId: string,
  borrowerId: string,
  updateData: UpdateLoanInput
) => {
  // First, verify the loan exists and belongs to the borrower
  const existingLoan = await prisma.loan.findUnique({
    where: { id: loanId },
    select: {
      id: true,
      borrowerId: true,
      status: true,
      amountFunded: true,
    },
  });

  if (!existingLoan) {
    throw new Error("Loan not found.");
  }

  if (existingLoan.borrowerId !== borrowerId) {
    throw new Error("You can only update your own loan applications.");
  }

  // Only allow updates if the loan is still in PENDING status and hasn't been funded
  if (
    existingLoan.status !== "PENDING" ||
    existingLoan.amountFunded.toNumber() > 0
  ) {
    throw new Error(
      "Can only update loans that are in PENDING status and have not received any funding."
    );
  }

  // Prepare update data
  const updateFields: any = {};

  if (updateData.title !== undefined) {
    updateFields.title = updateData.title;
  }

  if (updateData.description !== undefined) {
    updateFields.description = updateData.description;
  }

  if (updateData.amountRequested !== undefined) {
    updateFields.amountRequested = updateData.amountRequested;
  }

  if (updateData.interestRate !== undefined) {
    updateFields.interestRate = updateData.interestRate;
  }

  if (updateData.duration !== undefined) {
    updateFields.duration = updateData.duration;
  }

  if (updateData.durationUnit !== undefined) {
    updateFields.durationUnit = updateData.durationUnit;
  }

  // Recalculate total interest if any relevant fields were updated
  if (
    updateData.amountRequested !== undefined ||
    updateData.interestRate !== undefined ||
    updateData.duration !== undefined ||
    updateData.durationUnit !== undefined
  ) {
    // Get current values for calculation
    const currentLoan = await prisma.loan.findUnique({
      where: { id: loanId },
      select: {
        amountRequested: true,
        interestRate: true,
        duration: true,
        durationUnit: true,
      },
    });

    if (currentLoan) {
      const newAmountRequested =
        updateData.amountRequested ?? currentLoan.amountRequested.toNumber();
      const newInterestRate =
        updateData.interestRate ?? currentLoan.interestRate.toNumber();
      const newDuration = updateData.duration ?? currentLoan.duration;
      const newDurationUnit =
        updateData.durationUnit ?? currentLoan.durationUnit;

      const totalInterest = calculateTotalInterest(
        newAmountRequested,
        newInterestRate,
        newDuration,
        newDurationUnit as any
      );

      updateFields.totalInterest = totalInterest;
    }
  }

  // Perform the update
  return prisma.loan.update({
    where: { id: loanId },
    data: updateFields,
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
    getRecentLoanListings(MAX_NEW_LISTINGS, userId), // Pass userId to exclude their own loans
  ]);

  const investmentSummary = calculateInvestmentSummary(investments);
  const formattedListings = formatLoanListings(newListings);

  return {
    investmentSummary,
    newListings: formattedListings,
  };
};
/**
 * Handles a lender's commitment to fund a loan (Phase 1: Escrow).
 * 1. Moves funds from Lender's availableBalance to escrowBalance (FUNDING_COMMIT).
 * 2. If 100% funded, changes status to FULLY_FUNDED, awaiting manual disbursement.
 */
export const fundLoanService = async (
  loanId: string,
  lenderId: string,
  amount: number
) => {
  const fundingAmountDecimal = new Prisma.Decimal(amount);

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // We use findUniqueOrThrow to ensure the record exists and to throw an error
    // that Prisma can catch and roll back the transaction.
    const loan = await tx.loan
      .findUniqueOrThrow({ where: { id: loanId } })
      .catch(() => {
        throw new Error("Loan not found.");
      });
    const lender = await tx.user
      .findUniqueOrThrow({
        where: { id: lenderId },
        select: { availableBalance: true, escrowBalance: true },
      })
      .catch(() => {
        throw new Error("Lender not found.");
      });

    // --- Validation Checks ---

    // SELF-FUNDING GATE: Prevent users from funding their own loans
    if (loan.borrowerId === lenderId) {
      throw new Error(
        "Self-funding is prohibited. You cannot fund your own loan."
      );
    }

    if (lender.availableBalance.toNumber() < amount) {
      throw new Error("Insufficient available funds in wallet.");
    }

    // Only allow funding if not yet fully funded
    if (
      loan.status === LoanStatus.FULLY_FUNDED ||
      loan.status === LoanStatus.ACTIVE ||
      loan.status === LoanStatus.REPAID
    ) {
      throw new Error("Loan is already fully funded or active.");
    }

    // Calculate the actual funding amount, capped by remaining amount
    const remainingAmount =
      loan.amountRequested.toNumber() - loan.amountFunded.toNumber();
    const fundingAmount = Math.min(amount, remainingAmount);

    if (fundingAmount <= 0) throw new Error("Loan is already fully funded.");

    // Store the state read at the start of the transaction for Optimistic Locking
    const originalAmountFunded = loan.amountFunded;

    // --- Atomic State Changes ---

    // 1. Debit the lender's AVAILABLE balance and credit their ESCROW balance
    await tx.user.update({
      where: { id: lenderId },
      data: {
        availableBalance: { decrement: fundingAmountDecimal },
        escrowBalance: { increment: fundingAmountDecimal },
      },
    });

    // 2. Record the commitment transaction
    await tx.transaction.create({
      data: {
        userId: lenderId,
        loanId: loanId,
        amount: fundingAmount,
        type: TransactionType.FUNDING_COMMIT,
        description: `Committed funds to loan: ${loanId}. Funds held in escrow.`,
      },
    });

    // 3. CRITICAL: Update the loan's funded amount and status using Optimistic Locking
    // We check that the amountFunded is STILL the original amount read.
    // If another transaction modified it, this update will fail (zero rows affected).
    const newAmountFunded = originalAmountFunded.toNumber() + fundingAmount;
    let newLoanStatus =
      newAmountFunded >= loan.amountRequested.toNumber()
        ? LoanStatus.FULLY_FUNDED
        : LoanStatus.FUNDING;

    // Use `updateMany` for conditional update based on the original state
    const updateResult = await tx.loan.updateMany({
      where: {
        id: loanId,
        // OPTIMISTIC LOCKING: Ensure the funded amount hasn't changed since we read it.
        amountFunded: originalAmountFunded,
      },
      data: {
        amountFunded: newAmountFunded,
        status: newLoanStatus,
      },
    });

    // If no row was updated, it means another transaction modified the loan concurrently (race condition won).
    if (updateResult.count === 0) {
      // Throw an error to roll back the entire transaction (debit and transaction create)
      throw new Error(
        "Loan state changed concurrently. Please try funding again."
      );
    }

    if (newLoanStatus === LoanStatus.FULLY_FUNDED) {
      // Call the internal disbursement function immediately within the same transaction
      const disbursementResult = await disburseLoanService(loanId);

      return {
        message: "Loan fully funded and automatically disbursed to borrower.",
        status: disbursementResult?.status ?? newLoanStatus,
      };
    }

    return { message: "Loan funded successfully.", status: newLoanStatus };
  });
};

/**
 * Get open loans available for funding (excludes loans created by the current user)
 * Market View: Excludes loans where the authenticated user is the borrower
 */
export const getOpenLoansService = async (
  page: number,
  pageSize: number,
  userId: string, // Added userId parameter for self-exclusion
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
    // MANDATORY: Exclude loans where the user is the borrower (Self-Funding Gate)
    borrowerId: {
      not: userId,
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
      durationUnit: true,
      totalInterest: true,
      principalRepaid: true,
      status: true,
      borrowerId: true,
      createdAt: true,
      updatedAt: true,
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

  // Map and normalize returned loans to plain objects and convert Decimals
  const mappedLoans = loans.map((loan: any) => ({
    id: loan.id,
    title: loan.title,
    description: loan.description,
    amountRequested: convertDecimalToNumber(loan.amountRequested),
    amountFunded: convertDecimalToNumber(loan.amountFunded),
    interestRate: convertDecimalToNumber(loan.interestRate),
    duration: loan.duration,
    durationUnit: loan.durationUnit,
    totalInterest: convertDecimalToNumber(loan.totalInterest),
    principalRepaid: convertDecimalToNumber(loan.principalRepaid),
    status: loan.status,
    borrowerId: loan.borrowerId,
    borrower: loan.borrower,
    createdAt: loan.createdAt,
    updatedAt: loan.updatedAt,
  }));

  return { loans: mappedLoans, totalCount, totalPages };
};

/**
 * Get all loans created by a borrower regardless of status
 * @param borrowerId - Borrower's user ID
 * @returns Array of loans with details
 */
export const getAllLoansByBorrower = async (
  borrowerId: string,
  page: number = 1,
  pageSize: number = 10,
  q?: string,
  minAmount?: number,
  maxAmount?: number,
  status?: string
): Promise<{
  loans: LoanWithDetails[];
  totalCount: number;
  totalPages: number;
}> => {
  const skip = (page - 1) * pageSize;

  const where: any = { borrowerId };

  if (q) {
    const searchTermUpper = q.toUpperCase();
    const orConditions: any[] = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];

    // If the search term matches a valid status, also filter by status
    const validStatuses = [
      "PENDING",
      "FUNDING",
      "FULLY_FUNDED",
      "ACTIVE",
      "REPAID",
    ];
    if (validStatuses.includes(searchTermUpper)) {
      where.status = searchTermUpper;
    }

    where.OR = orConditions;
  }

  if (minAmount) {
    where.amountRequested = { ...where.amountRequested, gte: minAmount };
  }

  if (maxAmount) {
    where.amountRequested = { ...where.amountRequested, lte: maxAmount };
  }

  if (status) {
    const statusUpper = status.toUpperCase();
    const validStatuses = [
      "PENDING",
      "FUNDING",
      "FULLY_FUNDED",
      "ACTIVE",
      "REPAID",
    ];
    if (validStatuses.includes(statusUpper)) {
      where.status = statusUpper;
    }
  }

  const loans = await prisma.loan.findMany({
    where,
    skip,
    take: pageSize,
    orderBy: { createdAt: "desc" },
  });

  const totalCount = await prisma.loan.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const mapped = loans.map(
    (loan: {
      id: string;
      title: string;
      description: string | null;
      amountRequested: Decimal;
      amountFunded: Decimal;
      interestRate: Decimal;
      duration: number;
      status: LoanStatus;
      createdAt: Date;
      updatedAt: Date;
    }): LoanWithDetails => ({
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
    })
  );

  return { loans: mapped, totalCount, totalPages };
};

/**
 * Get user's loans where they are either borrower or lender
 * Private View: Includes all loans where the authenticated user is either the borrower OR the lender
 */
export const getMyLoans = async (
  userId: string,
  page: number = 1,
  pageSize: number = 10,
  query?: string,
  minAmount?: number,
  maxAmount?: number,
  status?: string
): Promise<{
  loans: LoanWithDetails[];
  totalCount: number;
  totalPages: number;
}> => {
  const skip = (page - 1) * pageSize;

  // Base where clause using OR condition for borrower or lender
  const where: any = {
    OR: [
      { borrowerId: userId }, // User is the borrower
      { fundedBy: { some: { id: userId } } }, // User is a lender (has funded this loan)
    ],
  };

  // Add search functionality
  if (query) {
    const searchTermUpper = query.toUpperCase();
    const orConditions: any[] = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];

    // If the search term matches a valid status, also filter by status
    const validStatuses = [
      "PENDING",
      "FUNDING",
      "FULLY_FUNDED",
      "ACTIVE",
      "REPAID",
    ];
    if (validStatuses.includes(searchTermUpper)) {
      where.status = searchTermUpper;
    }

    // Combine OR conditions with existing where clause
    where.AND = [
      { OR: where.OR }, // Keep the borrower/lender OR condition
      { OR: orConditions }, // Add search OR conditions
    ];
    delete where.OR; // Remove the top-level OR since we're using AND now
  }

  // Add amount filters
  if (minAmount || maxAmount) {
    where.amountRequested = {};
    if (minAmount) {
      where.amountRequested.gte = minAmount;
    }
    if (maxAmount) {
      where.amountRequested.lte = maxAmount;
    }
  }

  // Add status filter
  if (status) {
    const statusUpper = status.toUpperCase();
    const validStatuses = [
      "PENDING",
      "FUNDING",
      "FULLY_FUNDED",
      "ACTIVE",
      "REPAID",
    ];
    if (validStatuses.includes(statusUpper)) {
      where.status = statusUpper;
    }
  }

  const [loans, totalCount] = await Promise.all([
    prisma.loan.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        borrower: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        fundedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
    prisma.loan.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Transform loans to include user's role in each loan
  const loansWithDetails: LoanWithDetails[] = loans.map((loan: any) => ({
    id: loan.id,
    title: loan.title,
    description: loan.description,
    amountRequested: convertDecimalToNumber(loan.amountRequested),
    amountFunded: convertDecimalToNumber(loan.amountFunded),
    interestRate: convertDecimalToNumber(loan.interestRate),
    duration: loan.duration,
    durationUnit: loan.durationUnit,
    totalInterest: convertDecimalToNumber(loan.totalInterest),
    principalRepaid: convertDecimalToNumber(loan.principalRepaid),
    status: loan.status,
    createdAt: loan.createdAt,
    updatedAt: loan.updatedAt,
    borrower: loan.borrower,
    fundedBy: loan.fundedBy,
    // Add user's role in this specific loan
    userRole: loan.borrowerId === userId ? "BORROWER" : "LENDER",
  }));

  return {
    loans: loansWithDetails,
    totalCount,
    totalPages,
  };
};

/**
 * Manually triggered after a loan reaches FULLY_FUNDED status.
 * 1. Clears escrow balances of all lenders (FUNDING_RELEASE).
 * 2. Credits the borrower's available balance (DISBURSEMENT).
 * 3. Sets the loan status to ACTIVE.
 */
export const disburseLoanService = async (loanId: string) => {
  return prisma.$transaction(async (tx: any) => {
    const loan = await tx.loan.findUnique({ where: { id: loanId } });

    if (!loan) throw new Error("Loan not found.");

    // Check for the correct status before disbursement
    if (loan.status !== LoanStatus.FULLY_FUNDED) {
      return;
      // throw new Error(
      //   `Loan status is ${loan.status}. Only fully funded loans can be disbursed.`
      // );
    }

    const disbursementAmount = loan.amountRequested.toNumber();

    // 1. Find all funding commitments to calculate contribution shares
    const fundingTransactions = await tx.transaction.findMany({
      where: { loanId: loanId, type: TransactionType.FUNDING_COMMIT },
      select: { userId: true, amount: true },
    });

    // Aggregate commitments by lender ID
    const lenderCommitments = fundingTransactions.reduce(
      (
        acc: Record<string, number>,
        tx: { userId: string | null; amount: Decimal }
      ) => {
        acc[tx.userId!] = (acc[tx.userId!] || 0) + tx.amount.toNumber();
        return acc;
      },
      {} as Record<string, number>
    );

    // 2. CLEAR EACH LENDER'S ESCROW BALANCE
    for (const [contributorId, committedAmount] of Object.entries(
      lenderCommitments
    )) {
      const committedAmountDecimal = committedAmount;

      // a. Debit the lender's escrowBalance (clearing the hold)
      await tx.user.update({
        where: { id: contributorId },
        data: { escrowBalance: { decrement: committedAmountDecimal } },
      });

      // b. Record the funding release transaction
      await tx.transaction.create({
        data: {
          userId: contributorId,
          loanId: loanId,
          amount: committedAmount,
          type: TransactionType.FUNDING_RELEASE,
          description:
            "Funds released from escrow; investment is now active principal.",
        },
      });
    }

    // 3. Credit the borrower's available balance
    await tx.user.update({
      where: { id: loan.borrowerId },
      data: { availableBalance: { increment: disbursementAmount } },
    });

    // 4. Record the disbursement transaction (Borrower receiving the funds)
    await tx.transaction.create({
      data: {
        userId: loan.borrowerId,
        loanId: loanId,
        amount: disbursementAmount,
        type: TransactionType.DISBURSEMENT,
        description: "Loan funds disbursed to borrower",
      },
    });

    // 5. Set loan status to ACTIVE
    await tx.loan.update({
      where: { id: loanId },
      data: { status: LoanStatus.ACTIVE },
    });

    return {
      message: "Loan successfully disbursed to borrower.",
      status: LoanStatus.ACTIVE,
    };
  });
};

// --- repayLoanService: PRO-RATA DISTRIBUTION ---

/**
 * Handles a borrower's repayment and distributes principal and interest pro-rata to all lenders.
 * Repayment is only allowed when the loan status is ACTIVE.
 */
export const repayLoanService = async (
  loanId: string,
  borrowerId: string,
  paymentAmount: number
) => {
  const paymentAmountDecimal = paymentAmount; // Using number for Prisma decrement/increment

  return prisma.$transaction(async (tx: any) => {
    // 1. Fetch loan and borrower data
    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      select: {
        id: true,
        borrowerId: true,
        status: true,
        amountRequested: true,
        principalRepaid: true,
        totalInterest: true,
        duration: true,
      },
    });

    if (!loan) throw new Error("Loan not found.");
    if (loan.borrowerId !== borrowerId)
      throw new Error("User is not the borrower for this loan.");

    // IMPORTANT CONSTRAINT 1: Loan must be ACTIVE to be repaid
    if (loan.status !== LoanStatus.ACTIVE) {
      throw new Error(
        "Loan is not in an ACTIVE state for repayment. Status must be ACTIVE."
      );
    }

    const borrower = await tx.user.findUnique({
      where: { id: borrowerId },
      select: { availableBalance: true, escrowBalance: true },
    });

    if (!borrower || borrower.availableBalance.toNumber() < paymentAmount) {
      throw new Error("Insufficient available funds to make repayment.");
    }

    // 2. DETERMINE FIXED INSTALLMENT PORTIONS (Enforcing Exact Payment)
    const totalPeriods = loan.duration;

    // Calculate the fixed principal portion per period
    const principalPerPeriod = loan.amountRequested.toNumber() / totalPeriods;
    // Calculate the fixed interest portion per period
    const interestPerPeriod = loan.totalInterest.toNumber() / totalPeriods;

    // Calculate the exact installment required (rounding to 2 decimal places)
    // This is the CRITICAL value that must be enforced.
    const requiredInstallmentAmount = parseFloat(
      (principalPerPeriod + interestPerPeriod).toFixed(2)
    );

    // Normalize the incoming payment amount for comparison
    const normalizedPaymentAmount = parseFloat(paymentAmount.toFixed(2));

    // IMPORTANT CONSTRAINT 2: Exact Payment Amount Check
    if (normalizedPaymentAmount !== requiredInstallmentAmount) {
      throw new Error(
        `Repayment amount must be exactly the required installment of $${requiredInstallmentAmount.toFixed(
          2
        )}.`
      );
    }

    // Use the calculated fixed portions for the transaction
    const principalPortion = principalPerPeriod;
    const interestPortion = interestPerPeriod;

    // 3. DEBIT BORROWER & UPDATE LOAN STATUS
    await tx.user.update({
      where: { id: borrowerId },
      data: { availableBalance: { decrement: paymentAmountDecimal } },
    });

    const newPrincipalRepaid =
      loan.principalRepaid.toNumber() + principalPortion;
    let newStatus =
      newPrincipalRepaid >= loan.amountRequested.toNumber()
        ? LoanStatus.REPAID
        : loan.status;

    await tx.loan.update({
      where: { id: loanId },
      data: {
        principalRepaid: newPrincipalRepaid,
        status: newStatus,
      },
    });

    // Record borrower's repayment transaction
    await tx.transaction.create({
      data: {
        userId: borrowerId,
        loanId: loanId,
        amount: paymentAmount,
        type: TransactionType.REPAYMENT,
        description: `Loan repayment made. Principal: ${principalPortion.toFixed(
          2
        )}, Interest: ${interestPortion.toFixed(2)}`,
      },
    });

    // 4. DISTRIBUTE FUNDS TO LENDERS (PRO-RATA)
    // Find original FUNDING_COMMIT transactions to calculate contribution shares
    const fundingTransactions = await tx.transaction.findMany({
      where: { loanId: loanId, type: TransactionType.FUNDING_COMMIT },
      select: { userId: true, amount: true },
    });

    const lenderContributions = fundingTransactions.reduce(
      (acc: Record<string, number>, tx: any) => {
        acc[tx.userId!] = (acc[tx.userId!] || 0) + tx.amount.toNumber();
        return acc;
      },
      {} as Record<string, number>
    );

    const totalFunded = loan.amountRequested.toNumber();

    // Distribute the repayment (Principal + Interest)
    for (const [lenderId, fundedAmount] of Object.entries(
      lenderContributions
    ) as [string, number][]) {
      const share = fundedAmount / totalFunded;

      const principalShare = principalPortion * share;
      const interestShare = interestPortion * share;
      const creditAmount = principalShare + interestShare;
      const creditAmountDecimal = creditAmount;

      // Credit the lender's available balance
      await tx.user.update({
        where: { id: lenderId },
        data: { availableBalance: { increment: creditAmountDecimal } },
      });

      // Record distribution transaction for the lender
      await tx.transaction.create({
        data: {
          userId: lenderId,
          loanId: loanId,
          amount: creditAmount,
          type: TransactionType.REPAYMENT,
          description: `Repayment received. P: ${principalShare.toFixed(
            2
          )}, I: ${interestShare.toFixed(2)}`,
        },
      });
    }

    return {
      message: "Repayment successfully processed.",
      newStatus: newStatus,
    };
  });
};

/**
 * Fetches all loans funded by a specific user (the lender), with pagination and optional search.
 * @param lenderId The ID of the user who funded the loan (the authenticated user).
 * @param page The page number for pagination.
 * @param pageSize The number of items per page.
 * @param q Optional search query string to filter by loan title or description.
 * @returns An object containing the paginated list of loans and total counts.
 */
export const getFundedLoansByLenderService = async (
  lenderId: string,
  page: number = 1,
  pageSize: number = 10,
  q?: string
) => {
  // Calculate skip for pagination
  const skip = (page - 1) * pageSize;

  // Build the dynamic 'where' clause for filtering and searching
  const where: any = {
    fundedBy: {
      some: {
        id: lenderId,
      },
    },
  };

  if (q) {
    const searchTermUpper = q.toUpperCase();
    const orConditions: any[] = [
      { title: { contains: q } },
      { description: { contains: q } },
    ];

    // Only add status filters if the search term matches valid enum values
    const validStatuses = [
      "PENDING",
      "FUNDING",
      "FULLY_FUNDED",
      "ACTIVE",
      "REPAID",
    ];

    if (validStatuses.includes(searchTermUpper)) {
      orConditions.push({ status: { equals: searchTermUpper } });
    }

    // Add borrower name search if available
    orConditions.push({
      borrower: {
        OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }],
      },
    });

    where.OR = orConditions;
  }

  // Fetch the paginated and filtered loans
  const loans = await prisma.loan.findMany({
    where,
    skip,
    take: pageSize,
    // Include borrower details for context
    include: {
      borrower: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc", // Sort by most recent loans first
    },
  });

  // Get the total count of loans for pagination (without skip/take)
  const totalCount = await prisma.loan.count({ where });
  const totalPages = Math.ceil(totalCount / pageSize);

  return { loans, totalCount, totalPages };
};
