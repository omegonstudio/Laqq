from django.test.runner import DiscoverRunner
from unittest import TextTestResult, TextTestRunner
import time


class DetailedTestResult(TextTestResult):
    """Custom test result that collects detailed information about each test."""

    def __init__(self, stream, descriptions, verbosity):
        super().__init__(stream, descriptions, verbosity)
        self.test_details = []
        self.current_test_start = None

    def startTest(self, test):
        super().startTest(test)
        self.current_test_start = time.time()

    def addSuccess(self, test):
        super().addSuccess(test)
        elapsed = time.time() - self.current_test_start
        self.test_details.append({
            'test': test,
            'status': 'OK',
            'elapsed': elapsed,
            'message': None
        })

    def addError(self, test, err):
        super().addError(test, err)
        elapsed = time.time() - self.current_test_start
        self.test_details.append({
            'test': test,
            'status': 'ERROR',
            'elapsed': elapsed,
            'message': str(err[1])
        })

    def addFailure(self, test, err):
        super().addFailure(test, err)
        elapsed = time.time() - self.current_test_start
        self.test_details.append({
            'test': test,
            'status': 'FAIL',
            'elapsed': elapsed,
            'message': str(err[1])
        })

    def addSkip(self, test, reason):
        super().addSkip(test, reason)
        elapsed = time.time() - self.current_test_start
        self.test_details.append({
            'test': test,
            'status': 'SKIP',
            'elapsed': elapsed,
            'message': reason
        })


class DetailedTestRunner(TextTestRunner):
    """Custom test runner that uses DetailedTestResult."""
    resultclass = DetailedTestResult


class DetailedReportTestRunner(DiscoverRunner):
    """Django test runner that prints a detailed report at the end."""

    def get_test_runner_kwargs(self):
        kwargs = super().get_test_runner_kwargs()
        kwargs['resultclass'] = DetailedTestResult
        return kwargs

    def run_suite(self, suite, **kwargs):
        resultclass = kwargs.get('resultclass', DetailedTestResult)
        runner = TextTestRunner(
            verbosity=self.verbosity,
            failfast=self.failfast,
            resultclass=resultclass
        )
        result = runner.run(suite)

        # Print detailed report
        self.print_detailed_report(result)

        return result

    def print_detailed_report(self, result):
        """Print a detailed report of all tests."""
        stream = result.stream

        stream.writeln("\n" + "=" * 70)
        stream.writeln("INFORME DETALLADO DE TESTS")
        stream.writeln("=" * 70 + "\n")

        # Group tests by app/module
        tests_by_app = {}
        for detail in result.test_details:
            test = detail['test']
            # Get the module name (e.g., 'products.tests')
            module = test.__class__.__module__
            app_name = module.split('.')[0]

            if app_name not in tests_by_app:
                tests_by_app[app_name] = []
            tests_by_app[app_name].append(detail)

        # Print report by app
        total_time = 0
        for app_name in sorted(tests_by_app.keys()):
            tests = tests_by_app[app_name]
            app_time = sum(t['elapsed'] for t in tests)
            total_time += app_time

            passed = sum(1 for t in tests if t['status'] == 'OK')
            failed = sum(1 for t in tests if t['status'] == 'FAIL')
            errors = sum(1 for t in tests if t['status'] == 'ERROR')
            skipped = sum(1 for t in tests if t['status'] == 'SKIP')

            stream.writeln(f"\n{app_name.upper()} ({len(tests)} tests, {app_time:.3f}s)")
            stream.writeln("-" * 70)

            for detail in tests:
                test = detail['test']
                test_name = test._testMethodName
                test_class = test.__class__.__name__
                status = detail['status']
                elapsed = detail['elapsed']

                # Get test docstring or generate description from method name
                doc = test._testMethodDoc
                if doc:
                    description = doc.strip().split('\n')[0]
                else:
                    # Convert test_method_name to readable description
                    description = test_name.replace('test_', '').replace('_', ' ').capitalize()

                # Status symbol
                if status == 'OK':
                    symbol = '[OK]'
                elif status == 'FAIL':
                    symbol = '[FAIL]'
                elif status == 'ERROR':
                    symbol = '[ERROR]'
                else:
                    symbol = '[SKIP]'

                stream.writeln(f"  {symbol} {test_class}.{test_name}")
                stream.writeln(f"       {description} ({elapsed:.3f}s)")

                if detail['message'] and status != 'OK':
                    # Truncate long error messages
                    msg = detail['message']
                    if len(msg) > 100:
                        msg = msg[:100] + "..."
                    stream.writeln(f"       -> {msg}")

            # App summary
            stream.writeln(f"\n  Resumen {app_name}: {passed} OK, {failed} FAIL, {errors} ERROR, {skipped} SKIP")

        # Final summary
        stream.writeln("\n" + "=" * 70)
        stream.writeln("RESUMEN FINAL")
        stream.writeln("=" * 70)

        total_tests = len(result.test_details)
        total_passed = sum(1 for t in result.test_details if t['status'] == 'OK')
        total_failed = sum(1 for t in result.test_details if t['status'] == 'FAIL')
        total_errors = sum(1 for t in result.test_details if t['status'] == 'ERROR')
        total_skipped = sum(1 for t in result.test_details if t['status'] == 'SKIP')

        stream.writeln(f"\nTotal tests: {total_tests}")
        stream.writeln(f"  - Pasados:  {total_passed}")
        stream.writeln(f"  - Fallidos: {total_failed}")
        stream.writeln(f"  - Errores:  {total_errors}")
        stream.writeln(f"  - Saltados: {total_skipped}")
        stream.writeln(f"\nTiempo total: {total_time:.3f}s")

        if total_failed == 0 and total_errors == 0:
            stream.writeln("\n*** TODOS LOS TESTS PASARON CORRECTAMENTE ***")
        else:
            stream.writeln(f"\n*** HAY {total_failed + total_errors} TESTS CON PROBLEMAS ***")

        stream.writeln("=" * 70 + "\n")
