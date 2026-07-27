begin;

drop function if exists public.save_admin_financial_transaction(
  bigint,
  integer,
  integer,
  text,
  text,
  numeric,
  date,
  text,
  text,
  text,
  text,
  text
);

alter table public.financial_transactions
  drop column if exists receipt_path;

create or replace function public.save_admin_financial_transaction(
  p_transaction_id bigint,
  p_budget_year_id integer,
  p_event_id integer,
  p_transaction_type text,
  p_category text,
  p_amount numeric,
  p_transaction_date date,
  p_status text,
  p_description text,
  p_reference_number text,
  p_payment_method text
)
returns public.financial_transactions
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_transaction public.financial_transactions;
begin
  if not public.is_active_admin() then
    raise exception 'Only active admins can save financial transactions';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if p_transaction_id is null then
    insert into public.financial_transactions (
      budget_year_id,
      event_id,
      transaction_type,
      category,
      amount,
      transaction_date,
      status,
      description,
      reference_number,
      payment_method,
      created_by
    )
    values (
      p_budget_year_id,
      p_event_id,
      p_transaction_type,
      nullif(trim(coalesce(p_category, '')), ''),
      p_amount,
      coalesce(p_transaction_date, current_date),
      'completed',
      nullif(trim(coalesce(p_description, '')), ''),
      nullif(trim(coalesce(p_reference_number, '')), ''),
      nullif(trim(coalesce(p_payment_method, '')), ''),
      auth.uid()
    )
    returning * into v_transaction;
  else
    update public.financial_transactions
    set budget_year_id = p_budget_year_id,
        event_id = p_event_id,
        transaction_type = p_transaction_type,
        category = nullif(trim(coalesce(p_category, '')), ''),
        amount = p_amount,
        transaction_date = coalesce(p_transaction_date, current_date),
        description = nullif(trim(coalesce(p_description, '')), ''),
        reference_number = nullif(trim(coalesce(p_reference_number, '')), ''),
        payment_method = nullif(trim(coalesce(p_payment_method, '')), '')
    where transaction_id = p_transaction_id
    returning * into v_transaction;

    if v_transaction.transaction_id is null then
      raise exception 'Financial transaction not found';
    end if;
  end if;

  return v_transaction;
end;
$function$;

revoke all on function public.save_admin_financial_transaction(
  bigint,
  integer,
  integer,
  text,
  text,
  numeric,
  date,
  text,
  text,
  text,
  text
) from public, anon;

grant execute on function public.save_admin_financial_transaction(
  bigint,
  integer,
  integer,
  text,
  text,
  numeric,
  date,
  text,
  text,
  text,
  text
) to authenticated;

commit;
