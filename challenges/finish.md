# Finish

[Previous Challenge](challenge-07.md) - **[Home](../WORKSHOP.md)**

## Congratulations

You finished the **Agentic SDLC MicroHack**! 🎉

Over the course of the day your team took the **Octocat Supply** application through the complete Agentic Software Development Lifecycle — you **planned**, **built**, **tested**, **reviewed**, **deployed** to Azure, **monitored** with the Azure SRE Agent, and set up agentic workflows to **maintain** it over time. Along the way you practised driving agents deliberately: structured prompting, context budgeting, model selection, requirement refinement from organizational signal, and least-privilege automation.

The point was never just to write code faster — it was to work *with* agents across the whole lifecycle while keeping changes scoped, tested, secure, and reviewable.

If you want to give feedback, please don't hesitate to open an Issue on the repository or get in touch with one of the contributors directly.

Thank you for investing the time — and see you next time! 🚀

## Clean up your workshop resources

**Stopping an app is not the same as stopping all charges.** Check the subscription and resource group you actually used. Save any evidence or data you need before deleting anything.

1. Review your workshop's Azure resources, including Container Apps, the registry, Log Analytics, storage, and the SRE Agent. Delete a resource group **only if it is dedicated to this lab and you are authorized to remove everything in it**. For shared groups, coordinate with the owner and remove only your lab resources. Check Azure Cost Management afterward; billing data can be delayed.
2. Remove workshop-only federated credentials, identities, role assignments, and repository/environment secrets when they are no longer needed. Do not remove shared identities or permissions.
3. Disable scheduled or agentic workflows created during the exercises in your own fork. Review open bot-created issues and pull requests.
4. Stop or delete workshop Codespaces you no longer need, and review Codespaces billing/storage. Stop local development servers.
5. Record what worked, which agent findings you verified, and what still needs a human decision.

These read-only commands help you confirm scope before using the Azure portal or your reviewed cleanup process:

```bash
az account show --query "{subscription:name,id:id}" --output table
az group show --name "<your-workshop-resource-group>" --output table
az resource list --resource-group "<your-workshop-resource-group>" --output table
```

No resource deletion is performed by this guide.

## Success criteria

* You recorded your learning and any remaining work honestly; reading a page is not proof that a challenge is complete.
* You reviewed Azure resources and costs, and removed or handed over the lab resources you were authorized to manage (or confirmed that you created none).
* You reviewed workshop-only credentials, identities, and automation for removal or handover.
* You stopped unneeded development environments and checked their storage and billing.
