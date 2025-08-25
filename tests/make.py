import pandas as pd
import os
from faker import Faker
import random

fake = Faker()
output_dir = "test_xlsforms_valid"
os.makedirs(output_dir, exist_ok=True)

forms_df = pd.DataFrame([{
    "Language": "en",
    "Title": "Test Form Missing Forms Sheet"
}])

questions_df = pd.DataFrame([{
    "Order": 1,
    "Title": "Sample Question",
    "View Sequence": 1,
    "Input Type": 1
}])

options_df = pd.DataFrame([{
    "Order": 1,
    "Id": 1,
    "Label": "Option 1"
}])

file_path = os.path.join(output_dir, "missing_forms_sheet.xlsx")
with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
    # Skip the Forms sheet intentionally
    questions_df.to_excel(writer, sheet_name="Questions Info", index=False)
    options_df.to_excel(writer, sheet_name="Answer Options", index=False)

file_path = os.path.join(output_dir, "missing_questions_sheet.xlsx")
with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
    forms_df.to_excel(writer, sheet_name="Forms", index=False)
    # Skip the Questions Info sheet intentionally
    options_df.to_excel(writer, sheet_name="Answer Options", index=False)

file_path = os.path.join(output_dir, "missing_options_sheet.xlsx")
with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
    forms_df.to_excel(writer, sheet_name="Forms", index=False)
    questions_df.to_excel(writer, sheet_name="Questions Info", index=False)
    # Skip the Answer Options sheet intentionally

forms_missing_lang = pd.DataFrame([{
    "Title": "Form with missing Language column"
}])

file_path = os.path.join(output_dir, "missing_language_column.xlsx")
with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
    forms_missing_lang.to_excel(writer, sheet_name="Forms", index=False)
    questions_df.to_excel(writer, sheet_name="Questions Info", index=False)
    options_df.to_excel(writer, sheet_name="Answer Options", index=False)

forms_missing_title = pd.DataFrame([{
    "Language": "en"
}])

file_path = os.path.join(output_dir, "missing_title_column.xlsx")
with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
    forms_missing_title.to_excel(writer, sheet_name="Forms", index=False)
    questions_df.to_excel(writer, sheet_name="Questions Info", index=False)
    options_df.to_excel(writer, sheet_name="Answer Options", index=False)

questions_missing_order = pd.DataFrame([{
    "Title": "Question without Order",
    "View Sequence": 1,
    "Input Type": 1
}])

file_path = os.path.join(output_dir, "missing_order_column.xlsx")
with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
    forms_df.to_excel(writer, sheet_name="Forms", index=False)
    questions_missing_order.to_excel(writer, sheet_name="Questions Info", index=False)
    options_df.to_excel(writer, sheet_name="Answer Options", index=False)

questions_invalid_types = pd.DataFrame([
    {"Order": 1, "Title": "Valid Question", "View Sequence": 1, "Input Type": 1},
    {"Order": 2, "Title": "Invalid Type 99", "View Sequence": 2, "Input Type": 99},
    {"Order": 3, "Title": "Invalid Type Text", "View Sequence": 3, "Input Type": "text"},
    {"Order": 4, "Title": "Invalid Type -1", "View Sequence": 4, "Input Type": -1},
])

file_path = os.path.join(output_dir, "invalid_question_types.xlsx")
with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
    forms_df.to_excel(writer, sheet_name="Forms", index=False)
    questions_invalid_types.to_excel(writer, sheet_name="Questions Info", index=False)
    options_df.to_excel(writer, sheet_name="Answer Options", index=False)

questions_invalid_order = pd.DataFrame([
    {"Order": "first", "Title": "Question with text order", "View Sequence": 1, "Input Type": 1},
    {"Order": 2.5, "Title": "Question with decimal order", "View Sequence": 2, "Input Type": 1},
    {"Order": -1, "Title": "Question with negative order", "View Sequence": 3, "Input Type": 1},
    {"Order": 0, "Title": "Question with zero order", "View Sequence": 4, "Input Type": 1},
])

file_path = os.path.join(output_dir, "invalid_order_values.xlsx")
with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
    forms_df.to_excel(writer, sheet_name="Forms", index=False)
    questions_invalid_order.to_excel(writer, sheet_name="Questions Info", index=False)
    options_df.to_excel(writer, sheet_name="Answer Options", index=False)

questions_duplicate_order = pd.DataFrame([
    {"Order": 1, "Title": "First question", "View Sequence": 1, "Input Type": 1},
    {"Order": 1, "Title": "Duplicate order question", "View Sequence": 2, "Input Type": 2},
    {"Order": 2, "Title": "Third question", "View Sequence": 3, "Input Type": 1},
])

file_path = os.path.join(output_dir, "duplicate_question_order.xlsx")
with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
    forms_df.to_excel(writer, sheet_name="Forms", index=False)
    questions_duplicate_order.to_excel(writer, sheet_name="Questions Info", index=False)
    options_df.to_excel(writer, sheet_name="Answer Options", index=False)

options_duplicate = pd.DataFrame([
    {"Order": 1, "Id": 1, "Label": "Option 1"},
    {"Order": 1, "Id": 1, "Label": "Duplicate Option 1"},  # Duplicate combination
    {"Order": 1, "Id": 2, "Label": "Option 2"},
    {"Order": 2, "Id": 1, "Label": "Question 2 Option 1"},
])

file_path = os.path.join(output_dir, "duplicate_option_ids.xlsx")
with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
    forms_df.to_excel(writer, sheet_name="Forms", index=False)
    questions_df.to_excel(writer, sheet_name="Questions Info", index=False)
    options_duplicate.to_excel(writer, sheet_name="Answer Options", index=False)

forms_empty = pd.DataFrame([{
    "Language": "",
    "Title": ""
}])

file_path = os.path.join(output_dir, "empty_form_values.xlsx")
with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
    forms_empty.to_excel(writer, sheet_name="Forms", index=False)
    questions_df.to_excel(writer, sheet_name="Questions Info", index=False)
    options_df.to_excel(writer, sheet_name="Answer Options", index=False)

questions_missing_titles = pd.DataFrame([
    {"Order": 1, "Title": "Valid question", "View Sequence": 1, "Input Type": 1},
    {"Order": 2, "Title": "", "View Sequence": 2, "Input Type": 2},
    {"Order": 3, "Title": None, "View Sequence": 3, "Input Type": 1},
])

file_path = os.path.join(output_dir, "missing_question_titles.xlsx")
with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
    forms_df.to_excel(writer, sheet_name="Forms", index=False)
    questions_missing_titles.to_excel(writer, sheet_name="Questions Info", index=False)
    options_df.to_excel(writer, sheet_name="Answer Options", index=False)

options_missing_labels = pd.DataFrame([
    {"Order": 1, "Id": 1, "Label": "Valid option"},
    {"Order": 1, "Id": 2, "Label": ""},
    {"Order": 1, "Id": 3, "Label": None},
])

file_path = os.path.join(output_dir, "missing_option_labels.xlsx")
with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
    forms_df.to_excel(writer, sheet_name="Forms", index=False)
    questions_df.to_excel(writer, sheet_name="Questions Info", index=False)
    options_missing_labels.to_excel(writer, sheet_name="Answer Options", index=False)

questions_choice_no_options = pd.DataFrame([
    {"Order": 1, "Title": "Text question", "View Sequence": 1, "Input Type": 1},
    {"Order": 2, "Title": "Select one without options", "View Sequence": 2, "Input Type": 2},
    {"Order": 3, "Title": "Select multiple without options", "View Sequence": 3, "Input Type": 3},
])

options_limited = pd.DataFrame([
    {"Order": 1, "Id": 1, "Label": "Option for text question (shouldn't be here)"}
])

file_path = os.path.join(output_dir, "choice_questions_no_options.xlsx")
with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
    forms_df.to_excel(writer, sheet_name="Forms", index=False)
    questions_choice_no_options.to_excel(writer, sheet_name="Questions Info", index=False)
    options_limited.to_excel(writer, sheet_name="Answer Options", index=False)

questions_limited = pd.DataFrame([
    {"Order": 1, "Title": "Only question", "View Sequence": 1, "Input Type": 1},
])

options_orphaned = pd.DataFrame([
    {"Order": 1, "Id": 1, "Label": "Option for existing question"},
    {"Order": 2, "Id": 1, "Label": "Option for non-existent question"},
    {"Order": 3, "Id": 1, "Label": "Another orphaned option"},
])

file_path = os.path.join(output_dir, "orphaned_options.xlsx")
with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
    forms_df.to_excel(writer, sheet_name="Forms", index=False)
    questions_limited.to_excel(writer, sheet_name="Questions Info", index=False)
    options_orphaned.to_excel(writer, sheet_name="Answer Options", index=False)

forms_invalid_lang = pd.DataFrame([
    {"Language": "invalid_lang", "Title": "Form with invalid language code"}
])

file_path = os.path.join(output_dir, "invalid_language_code.xlsx")
with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
    forms_invalid_lang.to_excel(writer, sheet_name="Forms", index=False)
    questions_df.to_excel(writer, sheet_name="Questions Info", index=False)
    options_df.to_excel(writer, sheet_name="Answer Options", index=False)

forms_long_title = pd.DataFrame([{
    "Language": "en",
    "Title": "A" * 300  # Very long title (over 255 chars)
}])

questions_long_title = pd.DataFrame([
    {"Order": 1, "Title": "B" * 1200, "View Sequence": 1, "Input Type": 1},  # Very long question
])

options_long_label = pd.DataFrame([
    {"Order": 1, "Id": 1, "Label": "C" * 600},  # Very long option label
])

file_path = os.path.join(output_dir, "very_long_values.xlsx")
with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
    forms_long_title.to_excel(writer, sheet_name="Forms", index=False)
    questions_long_title.to_excel(writer, sheet_name="Questions Info", index=False)
    options_long_label.to_excel(writer, sheet_name="Answer Options", index=False)

forms_multiple_issues = pd.DataFrame([
    {"Language": "", "Title": ""},  # Missing both required values
    {"Language": "fr", "Title": "Extra row (should cause warning)"}  # Extra row
])

questions_multiple_issues = pd.DataFrame([
    {"Order": "bad", "Title": "", "View Sequence": -1, "Input Type": 99},  # Multiple errors
    {"Order": 1, "Title": "Valid question", "View Sequence": 1, "Input Type": 2},  # Choice question
    {"Order": 1, "Title": "Duplicate order", "View Sequence": 2, "Input Type": 1},  # Duplicate order
])

options_multiple_issues = pd.DataFrame([
    {"Order": "bad", "Id": "bad", "Label": ""},  # All bad values
    {"Order": 2, "Id": 1, "Label": "Option for non-choice question"},  # Orphaned
])

file_path = os.path.join(output_dir, "multiple_issues_complex.xlsx")
with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
    forms_multiple_issues.to_excel(writer, sheet_name="Forms", index=False)
    questions_multiple_issues.to_excel(writer, sheet_name="Questions Info", index=False)
    options_multiple_issues.to_excel(writer, sheet_name="Answer Options", index=False)

empty_df = pd.DataFrame()

file_path = os.path.join(output_dir, "empty_sheets.xlsx")
with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
    empty_df.to_excel(writer, sheet_name="Forms", index=False)
    empty_df.to_excel(writer, sheet_name="Questions Info", index=False)
    empty_df.to_excel(writer, sheet_name="Answer Options", index=False)

with open(os.path.join(output_dir, "fake_excel.xlsx"), 'w') as f:
    f.write("This is not an Excel file")

csv_content = "Language,Title\nen,Fake Excel File"
with open(os.path.join(output_dir, "csv_as_xlsx.xlsx"), 'w') as f:
    f.write(csv_content)

print(f"\nSuccessfully generated {len(os.listdir(output_dir))} incorrect test files in '{output_dir}'")
print("\nTest file categories created:")
print("• Missing sheets (3 files)")
print("• Missing columns (3 files)")
print("• Invalid data types (2 files)")
print("• Duplicate values (2 files)")
print("• Missing required values (3 files)")
print("• Cross-reference issues (2 files)")
print("• Language/format issues (2 files)")
print("• Complex edge cases (2 files)")
print("• Invalid file formats (2 files)")

