from celery import shared_task
import time
import json
import csv
from .extensions import db
from .models import User, Order, Bill

# Celery tasks configuration set up by Deepak and Arvind

@shared_task
def daily_reminder_task():
    """ BJ-1: Daily Reminder to inactive customers """
    print("[Anantha's Kitchen] Running daily_reminder_task...")
    # In a real app, this would query users who haven't ordered in 7 days and send an email
    # For now, we simulate the log output.
    print("[Anantha's Kitchen] Reminders sent to inactive users! - Deepan")
    return "Daily Reminder Complete"

@shared_task
def monthly_report_task():
    """ BJ-2: Monthly Report to Admin """
    print("[Anantha's Kitchen] Generating monthly revenue report...")
    # Simulate generating PDF/HTML report
    time.sleep(2)
    print("[Anantha's Kitchen] Monthly report sent to Admin via Email! - Arvind")
    return "Monthly Report Complete"

@shared_task
def export_csv_task(customer_id, email):
    """ BJ-3: Async CSV Export """
    print(f"[Anantha's Kitchen] Generating CSV export for customer {customer_id}...")
    
    # Normally we would generate a CSV and send it via email
    # Let's simulate the delay
    time.sleep(3)
    
    print(f"[Anantha's Kitchen] CSV export completed and sent to {email}! - Deepak")
    return "CSV Export Complete"
