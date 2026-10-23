"""Exercise the built guide at its real project base, without Azure side effects."""

import argparse
import json
from pathlib import Path
import re
import traceback

from playwright.sync_api import expect, sync_playwright


STORAGE_KEY = "agentic-sdlc-workshop:progress:v1"
THEME_KEY = "agentic-sdlc-workshop:theme:v1"
COUNTS = [3, 4, 4, 3, 4, 4, 4]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:4321/agentic-sdlc-workshop/")
    parser.add_argument("--artifacts", default="test-results")
    parser.add_argument("--app-url", default=None)
    parser.add_argument("--smoke", action="store_true")
    parser.add_argument("--only", help="Run only flow names containing this text")
    parser.add_argument("--color-scheme", choices=["light", "dark"], default="light")
    args = parser.parse_args()
    base = args.base_url.rstrip("/") + "/"
    artifacts = Path(args.artifacts)
    artifacts.mkdir(parents=True, exist_ok=True)
    results = []
    errors = []
    failed_responses = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 1000}, reduced_motion="reduce", color_scheme=args.color_scheme)
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("response", lambda response: failed_responses.append(f"{response.status} {response.url}")
                if response.status >= 400 and response.url.startswith(base) else None)

        def go(slug=""):
            response = page.goto(base + slug, wait_until="networkidle")
            assert response and response.status == 200, f"Deep link did not return 200: {slug}"
            expect(page.locator("main h1")).to_have_count(1)
            expect(page.locator("[data-search-open]")).to_be_visible()

        def run(name, test):
            if args.only and args.only.casefold() not in name.casefold():
                return
            try:
                test()
                results.append({"test": name, "status": "passed"})
                print(f"PASS {name}", flush=True)
            except Exception:
                results.append({"test": name, "status": "failed", "traceback": traceback.format_exc()})
                page.screenshot(path=str(artifacts / "failure.png"), full_page=True)
                raise

        def overview():
            go()
            expect(page.get_by_role("heading", name="Build Octocat Supply with agents.")).to_be_visible()
            expect(page.locator(".route > li")).to_have_count(7)
            expect(page.locator(".diagram svg").first).to_be_visible(timeout=30000)
            assert page.locator(".diagram").count() >= 1
            page.screenshot(path=str(artifacts / "overview-desktop.png"), full_page=False)
            assert not errors, errors

        def theme_preferences():
            page.emulate_media(color_scheme="light")
            go("challenges/01/")
            select = page.get_by_role("combobox", name="Color theme")
            expect(select).to_have_value("system")
            expect(page.locator("html")).to_have_attribute("data-theme", "light")
            select.select_option("dark")
            expect(page.locator("html")).to_have_attribute("data-theme", "dark")
            assert page.evaluate(f"localStorage.getItem({json.dumps(THEME_KEY)})") == "dark"
            assert page.locator("main").evaluate("(el) => getComputedStyle(el).backgroundColor") == "rgb(23, 36, 58)"
            assert page.locator("blockquote").first.evaluate("(el) => getComputedStyle(el).backgroundColor") == "rgb(27, 51, 69)"
            assert page.locator(".code-block").first.evaluate("(el) => getComputedStyle(el).backgroundColor") == "rgb(12, 21, 36)"
            page.screenshot(path=str(artifacts / "challenge-dark.png"), full_page=False)
            page.locator("[data-criterion]").first.check()
            page.get_by_role("button", name="Reset progress", exact=True).click()
            page.locator("[data-reset-confirm]").click()
            expect(select).to_have_value("dark")
            assert page.evaluate(f"localStorage.getItem({json.dumps(THEME_KEY)})") == "dark"
            go()
            expect(page.get_by_role("combobox", name="Color theme")).to_have_value("dark")
            expect(page.locator(".diagram-drawing[data-theme=dark] svg")).to_have_count(1, timeout=30000)
            page.screenshot(path=str(artifacts / "overview-dark.png"), full_page=False)
            page.reload(wait_until="networkidle")
            expect(page.locator("html")).to_have_attribute("data-theme", "dark")
            sibling = context.new_page()
            sibling.goto(base + "start/", wait_until="networkidle")
            sibling.get_by_role("combobox", name="Color theme").select_option("light")
            expect(page.locator("html")).to_have_attribute("data-theme", "light")
            expect(page.get_by_role("combobox", name="Color theme")).to_have_value("light")
            sibling.close()
            page.get_by_role("combobox", name="Color theme").select_option("system")
            page.emulate_media(color_scheme="dark")
            expect(page.locator("html")).to_have_attribute("data-theme", "dark")
            page.get_by_role("combobox", name="Color theme").select_option("light")
            expect(page.locator("html")).to_have_attribute("data-theme", "light")
            page.emulate_media(color_scheme="light")
            page.emulate_media(color_scheme="dark")
            expect(page.locator("html")).to_have_attribute("data-theme", "light")
            select = page.get_by_role("combobox", name="Color theme")
            select.focus()
            page.keyboard.press("End")
            expect(select).to_have_value("dark")
            expect(select).to_be_focused()
            page.keyboard.press("Home")
            expect(select).to_have_value("system")
            expect(page.locator("html")).to_have_attribute("data-theme", "dark")
            page.emulate_media(color_scheme=args.color_scheme)

        def theme_diagrams_and_surfaces():
            go("reference/src/docs/architecture/")
            select = page.get_by_role("combobox", name="Color theme")
            expect(page.locator(".diagram-drawing > svg")).to_have_count(2, timeout=30000)
            assert page.locator(".diagram svg g").first.evaluate("(el) => getComputedStyle(el).transitionDuration") == "0s"
            original_geometry = page.locator(".diagram-drawing > svg").evaluate_all("nodes => nodes.map(svg => svg.getAttribute('viewBox'))")
            for choice in ["dark", "light", "dark", "light", "dark"]:
                select.select_option(choice)
            expect(page.locator(".diagram-drawing[data-theme=dark][aria-busy=false] svg")).to_have_count(2, timeout=30000)
            updated_geometry = page.locator(".diagram-drawing > svg").evaluate_all("nodes => nodes.map(svg => svg.getAttribute('viewBox'))")
            assert updated_geometry == original_geometry, f"Changing colors must not distort diagram geometry: {original_geometry} -> {updated_geometry}"
            assert page.locator(".diagram svg text, .diagram svg .nodeLabel").evaluate_all("nodes => nodes.every(node => node.getBoundingClientRect().height >= 10)"), "Diagram labels must remain readable rather than shrinking into a huge viewBox"
            expect(page.locator(".diagram")).to_have_count(2)
            expect(page.locator(".diagram .code-toolbar button")).to_have_count(2)
            page.screenshot(path=str(artifacts / "diagrams-dark.png"), full_page=True)
            page.locator("[data-search-open]").click()
            page.locator("[data-search-input]").fill("OIDC")
            expect(page.locator("[data-search-results] a").first).to_be_visible()
            assert page.locator("[data-search-dialog]").evaluate("(el) => getComputedStyle(el).backgroundColor") == "rgb(23, 36, 58)"
            page.screenshot(path=str(artifacts / "search-dark.png"), full_page=False)
            page.locator("[data-search-close]").click()
            page.set_viewport_size({"width": 320, "height": 900})
            go("challenges/01/")
            expect(page.get_by_role("combobox", name="Color theme")).to_be_visible()
            assert not page.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1")
            nav = page.locator(".workshop-rail > details")
            nav.locator("summary").click()
            expect(nav.get_by_role("link", name="Resources", exact=True)).to_be_visible()
            nav.locator("summary").click()
            page.screenshot(path=str(artifacts / "challenge-dark-mobile.png"), full_page=False)
            page.set_viewport_size({"width": 1440, "height": 1000})
            page.get_by_role("combobox", name="Color theme").select_option("system")

        def theme_first_paint_and_failures():
            isolated = browser.new_context(color_scheme="light")
            isolated.add_init_script(f"localStorage.setItem({json.dumps(THEME_KEY)}, 'dark')")
            other = isolated.new_page()
            other.route("**/_astro/*.js", lambda route: route.abort())
            other.goto(base + "challenges/01/", wait_until="networkidle")
            expect(other.locator("html")).to_have_attribute("data-theme", "dark")
            assert other.locator("main").evaluate("(el) => getComputedStyle(el).backgroundColor") == "rgb(23, 36, 58)"
            expect(other.locator("[data-theme-control]")).to_be_hidden()
            isolated.close()
            cases = [
                ("Object.defineProperty(window, 'localStorage', {get(){throw new DOMException('Blocked', 'SecurityError')}})", "could not be saved or read"),
                ("Storage.prototype.setItem = function(){throw new DOMException('Full', 'QuotaExceededError')}", "could not be saved or read"),
                (f"localStorage.setItem({json.dumps(THEME_KEY)}, 'invalid')", "not recognized"),
            ]
            for script, message in cases:
                isolated = browser.new_context(color_scheme="light")
                isolated.add_init_script(script)
                other = isolated.new_page()
                other.goto(base + "challenges/01/", wait_until="networkidle")
                select = other.get_by_role("combobox", name="Color theme")
                if message == "not recognized":
                    expect(other.locator("[data-theme-notice]")).to_contain_text(message)
                    select.select_option("dark")
                    expect(other.locator("[data-theme-notice]")).to_be_hidden()
                else:
                    select.select_option("dark")
                    expect(other.locator("[data-theme-notice]")).to_contain_text(message)
                    expect(other.locator("[data-announcement]")).to_contain_text("not saved")
                expect(other.locator("html")).to_have_attribute("data-theme", "dark")
                isolated.close()
            isolated = browser.new_context(java_script_enabled=False, color_scheme="dark")
            other = isolated.new_page()
            other.goto(base + "challenges/01/", wait_until="networkidle")
            assert other.locator("main").evaluate("(el) => getComputedStyle(el).backgroundColor") == "rgb(23, 36, 58)"
            expect(other.get_by_role("heading", name="Goal", exact=True)).to_be_visible()
            isolated.close()

        def challenges_and_finish():
            for number, count in enumerate(COUNTS, 1):
                go(f"challenges/{number:02d}/")
                for heading in ["Goal", "Actions", "Success criteria"]:
                    expect(page.get_by_role("heading", name=heading, exact=True)).to_be_visible()
                expect(page.locator("input[data-criterion]")).to_have_count(count)
                expect(page.locator("[data-complete]")).to_be_disabled()
                expect(page.get_by_role("button", name=f"Copy Challenge {number} starter prompt")).to_have_count(1)
                expect(page.get_by_role("link", name=f"Open solution {number} (spoilers)")).to_have_attribute(
                    "href", f"/agentic-sdlc-workshop/solutions/{number:02d}/"
                )
                expected_next = "finish/" if number == 7 else f"challenges/{number + 1:02d}/"
                expect(page.locator("a[rel=next]")).to_have_attribute("href", "/agentic-sdlc-workshop/" + expected_next)
            go("finish/")
            expect(page.get_by_role("heading", name="Clean up your workshop resources")).to_be_visible()
            expect(page.locator("input[data-criterion]")).to_have_count(4)
            assert "No resource deletion is performed" in page.locator("main").inner_text()

        def solutions():
            for number in range(1, 8):
                go(f"solutions/{number:02d}/#approach")
                expect(page.locator("[data-solution-target]")).to_be_hidden()
                expect(page.get_by_role("heading", name="Approach", exact=True)).to_have_count(0)
                assert "Duration:" not in page.locator("main").inner_text()
                expect(page.locator('meta[name="robots"]')).to_have_attribute("content", "noindex, nofollow")
                page.get_by_role("button", name=f"Reveal solution {number}", exact=True).click()
                expect(page.get_by_role("heading", name="Approach", exact=True)).to_be_visible()
                expect(page.locator("[data-solution-target]")).to_be_visible()
                assert "Duration:" in page.locator("main").inner_text()
                page.reload(wait_until="networkidle")
                expect(page.locator("[data-solution-target]")).to_be_hidden()
            page.screenshot(path=str(artifacts / "solution-gate.png"), full_page=False)

        def progress():
            go()
            page.evaluate("localStorage.clear()")
            go("challenges/01/")
            checkboxes = page.locator("[data-criterion]")
            for checkbox in checkboxes.all():
                checkbox.check()
            page.get_by_role("button", name="Mark challenge complete", exact=True).click()
            expect(page.locator("[data-criteria-status]")).to_contain_text("Complete")
            page.reload(wait_until="networkidle")
            assert all(checkbox.is_checked() for checkbox in page.locator("[data-criterion]").all())
            expect(page.get_by_role("button", name="Mark as not complete", exact=True)).to_be_visible()
            go()
            expect(page.locator(".hero-resume")).to_have_attribute("href", "/agentic-sdlc-workshop/challenges/02/")
            expect(page.locator(".rail-progress [data-progress-summary]")).to_have_text("1 of 8 steps complete")
            go("challenges/01/")
            page.locator("[data-criterion]").first.uncheck()
            expect(page.locator(".rail-progress [data-progress-summary]")).to_have_text("0 of 8 steps complete")
            page.get_by_role("button", name="Reset progress", exact=True).click()
            page.get_by_role("button", name="Keep progress", exact=True).click()
            assert page.locator("[data-criterion]").nth(1).is_checked()
            page.get_by_role("button", name="Reset progress", exact=True).click()
            page.get_by_role("button", name="Reset progress", exact=True).last.click()
            assert not any(checkbox.is_checked() for checkbox in page.locator("[data-criterion]").all())
            assert page.evaluate(f"localStorage.getItem({json.dumps(STORAGE_KEY)})") is None
            for number in range(1, 8):
                go(f"challenges/{number:02d}/")
                for checkbox in page.locator("[data-criterion]").all():
                    checkbox.check()
                page.locator("[data-complete]").click()
            go("finish/")
            for checkbox in page.locator("[data-criterion]").all():
                checkbox.check()
            page.locator("[data-complete]").click()
            expect(page.locator(".rail-progress [data-progress-summary]")).to_have_text("8 of 8 steps complete")
            go()
            expect(page.locator(".hero-resume")).to_have_attribute("href", "/agentic-sdlc-workshop/finish/")
            page.evaluate("localStorage.clear()")

        def search():
            go()
            index = context.request.get(base + "search.json")
            assert index.ok
            data = index.json()
            assert len(data) > 100
            assert all("/solutions/" not in item["href"] for item in data)
            assert "Sprawling diff touching unrelated files" not in index.text()
            page.keyboard.press("/")
            expect(page.locator("[data-search-input]")).to_be_focused()
            page.locator("[data-search-input]").fill("OIDC")
            expect(page.locator("[data-search-results] a").first).to_be_visible()
            assert all("/solutions/" not in link.get_attribute("href") for link in page.locator("[data-search-results] a").all())
            page.locator("[data-search-input]").fill("qzxv-no-such-topic")
            expect(page.locator("[data-search-status]")).to_contain_text("No matches")
            page.keyboard.press("Escape")
            expect(page.locator("[data-search-dialog]")).not_to_be_visible()

        def copy():
            context.grant_permissions(["clipboard-read", "clipboard-write"])
            go("challenges/02/")
            button = page.get_by_role("button", name="Copy Challenge 2 starter prompt", exact=True)
            expected = page.locator(".starter-prompt pre code").inner_text()
            button.click()
            expect(page.locator(".starter-prompt .copy-feedback")).to_have_text("Copied to clipboard.")
            assert page.evaluate("navigator.clipboard.readText()") == expected
            blocked = browser.new_context()
            blocked.add_init_script("Object.defineProperty(navigator, 'clipboard', {value: {writeText: () => Promise.reject(new Error('blocked'))}})")
            blocked_page = blocked.new_page()
            blocked_page.goto(base + "challenges/02/", wait_until="networkidle")
            blocked_page.get_by_role("button", name="Copy Challenge 2 starter prompt", exact=True).click()
            expect(blocked_page.locator(".starter-prompt .copy-feedback")).to_contain_text("Copy failed")
            expect(blocked_page.locator(".starter-prompt .code-toolbar button")).to_have_text("Copy failed")
            blocked.close()

        def storage_failures():
            scripts = [
                ("Object.defineProperty(window, 'localStorage', {get(){throw new DOMException('Blocked', 'SecurityError')}})", "blocked"),
                (f"localStorage.setItem({json.dumps(STORAGE_KEY)}, '{{not json')", "valid JSON"),
                ("Storage.prototype.setItem = function(){throw new DOMException('Full', 'QuotaExceededError')}", "could not be saved"),
            ]
            for script, message in scripts:
                isolated = browser.new_context()
                isolated.add_init_script(script)
                other = isolated.new_page()
                other.goto(base + "challenges/01/", wait_until="networkidle")
                expect(other.locator("[data-storage-notice]")).to_contain_text(message)
                other.locator("[data-criterion]").first.check()
                expect(other.locator("[data-criteria-status]")).to_contain_text("on this page only")
                expect(other.locator("[data-storage-explanation]")).to_contain_text("Not saved")
                expect(other.locator(".resume-link")).to_be_hidden()
                assert "saved in this browser" not in other.locator("[data-criteria-status]").inner_text()
                isolated.close()
            # A real storage event updates an already-open tab.
            go("challenges/01/")
            sibling = context.new_page()
            sibling.goto(base + "challenges/01/", wait_until="networkidle")
            page.locator("[data-criterion]").first.check()
            expect(sibling.locator("[data-criterion]").first).to_be_checked()
            sibling.close()
            page.evaluate("localStorage.clear()")

        def search_failure():
            isolated = browser.new_context()
            other = isolated.new_page()
            other.route("**/search.json", lambda route: route.abort())
            other.goto(base, wait_until="networkidle")
            other.locator("[data-search-open]").click()
            expect(other.locator("[data-search-status]")).to_contain_text("could not be loaded")
            expect(other.locator("[data-search-retry]")).to_be_visible()
            other.unroute("**/search.json")
            other.locator("[data-search-retry]").click()
            other.locator("[data-search-input]").fill("SQLite")
            expect(other.locator("[data-search-results] a").first).to_be_visible()
            isolated.close()

        def keyboard():
            go()
            page.keyboard.press("Tab")
            expect(page.get_by_role("link", name="Skip to content", exact=True)).to_be_focused()
            page.keyboard.press("Enter")
            expect(page.locator("#main")).to_be_focused()
            link = page.get_by_role("navigation", name="Workshop", exact=True).get_by_role("link", name="Start here")
            link.focus()
            page.keyboard.press("Enter")
            expect(page).to_have_url(base + "start/")
            page.keyboard.press("/")
            expect(page.locator("[data-search-input]")).to_be_focused()
            page.keyboard.press("Escape")
            expect(page.locator("[data-search-dialog]")).not_to_be_visible()

        def reference_diagrams():
            go("reference/src/docs/architecture/")
            expect(page.locator(".diagram svg")).to_have_count(2, timeout=30000)
            for slug in ["start/", "resources/", "about/", "reference/assets/backlog/", "reference/assets/workiq/", "reference/infra/", "reference/scripts/", "reference/src/"]:
                go(slug)
            assert "Copyright (c) Microsoft Corporation" in context.request.get(base + "about/").text()
            notices = context.request.get(base + "third-party-notices.txt")
            assert notices.ok and "SIL OPEN FONT LICENSE" in notices.text()

        def mobile_and_overflow():
            for width in [320, 390, 768, 1100, 1440]:
                page.set_viewport_size({"width": width, "height": 900})
                for slug in ["", "challenges/01/", "challenges/02/", "solutions/05/", "reference/infra/", "reference/assets/backlog/"]:
                    go(slug)
                    overflow = page.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1")
                    assert not overflow, f"Horizontal overflow at {width}px on {slug}"
                if width == 390:
                    go()
                    nav = page.locator(".workshop-rail > details")
                    assert not nav.get_attribute("open")
                    summary = nav.locator("summary")
                    summary.focus()
                    page.keyboard.press("Enter")
                    assert nav.get_attribute("open") is not None
                    nav.get_by_role("link", name=re.compile("Build the cart")).click()
                    expect(page).to_have_url(base + "challenges/02/")
                    expect(page.locator(".workshop-rail > details")).not_to_have_attribute("open")
                    page.screenshot(path=str(artifacts / "challenge-mobile.png"), full_page=True)
                    go()
                    page.screenshot(path=str(artifacts / "overview-mobile.png"), full_page=False)
            page.set_viewport_size({"width": 1440, "height": 1000})

        def no_javascript():
            isolated = browser.new_context(java_script_enabled=False)
            other = isolated.new_page()
            for number in range(1, 8):
                response = other.goto(base + f"challenges/{number:02d}/")
                assert response and response.status == 200
                expect(other.get_by_role("heading", name="Goal", exact=True)).to_be_visible()
                expect(other.get_by_role("heading", name="Success criteria", exact=True)).to_be_visible()
            other.goto(base + "solutions/01/")
            expect(other.get_by_role("link", name="Read the full solution on GitHub (spoilers)")).to_be_visible()
            expect(other.locator("[data-solution-target]")).to_be_hidden()
            isolated.close()

        def app_smoke():
            app_url = args.app_url.rstrip("/") + "/"
            response = context.request.get(app_url + "api/products")
            assert response.ok, "The same-origin Vite proxy must return the API catalogue"
            data = response.json()
            assert isinstance(data, list) and len(data) > 0
            other = context.new_page()
            other.goto(app_url, wait_until="networkidle")
            assert "Octo" in other.locator("body").inner_text()
            other.screenshot(path=str(artifacts / "starter-app.png"), full_page=False)
            other.close()

        try:
            run("overview, connected route, and Mermaid", overview)
            run("theme preferences, system changes, keyboard, persistence, and reset independence", theme_preferences)
            run("theme-aware diagrams, dialogs, and mobile controls", theme_diagrams_and_surfaces)
            run("theme first paint, no-JavaScript appearance, and honest storage failures", theme_first_paint_and_failures)
            run("all seven challenges and cleanup deep links", challenges_and_finish)
            run("all seven explicit per-visit solution gates", solutions)
            run("static search excludes all solutions", search)
            run("reference docs, original license, and font notices", reference_diagrams)
            run("keyboard skip, navigation, and search", keyboard)
            run("mobile layouts, navigation, and no overflow", mobile_and_overflow)
            if not args.smoke:
                run("persisted checklist, completion, resume, and confirmed reset", progress)
                run("clipboard success and honest failure", copy)
                run("blocked, corrupt, full, and cross-tab storage", storage_failures)
                run("search fetch failure and retry", search_failure)
                run("complete reading without JavaScript", no_javascript)
            if args.app_url:
                run("runnable app and private same-origin API proxy", app_smoke)
            assert not errors, f"Uncaught browser errors: {errors}"
            assert not failed_responses, f"Missing site assets/routes: {failed_responses}"
            print(f"Verified {len(results)} browser flows at {base}", flush=True)
        finally:
            (artifacts / "browser-report.json").write_text(json.dumps({
                "base_url": base, "results": results, "page_errors": errors, "failed_responses": failed_responses,
            }, indent=2), encoding="utf-8")
            context.close()
            browser.close()


if __name__ == "__main__":
    main()
