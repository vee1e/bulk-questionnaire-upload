#!/usr/bin/env python3
"""
Test script to demonstrate the enhanced validation system
Usage: python test_validation.py
"""

import asyncio
import sys
import os
import io
import json

# Add backend to path
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

try:
    from fastapi import UploadFile
    from services.xlsform_parser import XLSFormParser
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running this from the tests directory and have the required dependencies installed.")
    sys.exit(1)

async def test_validation_file(file_path: str):
    """Test validation for a single file"""
    print(f"\n🧪 Testing: {os.path.basename(file_path)}")
    print("=" * 60)

    try:
        # Read the file
        with open(file_path, 'rb') as f:
            file_content = f.read()

        # Create UploadFile object
        upload_file = UploadFile(
            filename=os.path.basename(file_path),
            file=io.BytesIO(file_content)
        )

        # Initialize parser and validate
        parser = XLSFormParser()
        result = await parser.validate_file(upload_file)

        # Display results
        print(f"✅ Valid: {result['valid']}")
        print(f"📝 Message: {result['message']}")

        if result.get('errors'):
            print(f"\n❌ Errors ({len(result['errors'])}):")
            for error in result['errors']:
                location = f"{error['location']}"
                if error.get('row'):
                    location += f" (Row {error['row']})"
                if error.get('column'):
                    location += f" (Column: {error['column']})"
                print(f"  • {error['type']}: {error['message']} [{location}]")

        if result.get('warnings'):
            print(f"\n⚠️  Warnings ({len(result['warnings'])}):")
            for warning in result['warnings']:
                location = f"{warning['location']}"
                if warning.get('row'):
                    location += f" (Row {warning['row']})"
                if warning.get('column'):
                    location += f" (Column: {warning['column']})"
                print(f"  • {warning['type']}: {warning['message']} [{location}]")

        # Sheet validation details
        if result.get('sheets'):
            print(f"\n📊 Sheet Validation:")
            for sheet in result['sheets']:
                status = "✅" if sheet['exists'] and not sheet['missing_columns'] else "❌"
                print(f"  {status} {sheet['name']}: {sheet['row_count']} rows")
                if sheet['missing_columns']:
                    print(f"    Missing columns: {', '.join(sheet['missing_columns'])}")

        return result['valid']

    except Exception as e:
        print(f"❌ Error testing file: {str(e)}")
        return False

async def main():
    """Main test function"""
    print("🚀 Enhanced XLSForm Validation Test Suite")
    print("=" * 60)

    # Test directory
    test_dir = os.path.join(os.path.dirname(__file__), 'test_xlsforms_incorrect')

    if not os.path.exists(test_dir):
        print(f"❌ Test directory not found: {test_dir}")
        print("Please run 'python make.py' first to generate test files.")
        return

    # Get all test files
    test_files = [f for f in os.listdir(test_dir) if f.endswith('.xlsx')]

    if not test_files:
        print(f"❌ No test files found in {test_dir}")
        return

    print(f"📁 Found {len(test_files)} test files")

    # Test each file
    valid_count = 0
    total_count = len(test_files)

    for test_file in sorted(test_files):
        file_path = os.path.join(test_dir, test_file)
        is_valid = await test_validation_file(file_path)
        if is_valid:
            valid_count += 1

    # Summary
    print("\n" + "=" * 60)
    print("📈 Test Summary")
    print("=" * 60)
    print(f"Total files tested: {total_count}")
    print(f"Valid files: {valid_count}")
    print(f"Invalid files: {total_count - valid_count}")
    print(f"Success rate: {(total_count - valid_count) / total_count * 100:.1f}% (lower is better for error testing)")

    if valid_count > 0:
        print(f"\n⚠️  Warning: {valid_count} files passed validation when they should have failed!")
        print("This may indicate issues with the validation logic.")
    else:
        print(f"\n🎉 Excellent! All test files correctly failed validation.")
        print("The enhanced validation system is working properly!")

if __name__ == "__main__":
    asyncio.run(main())
